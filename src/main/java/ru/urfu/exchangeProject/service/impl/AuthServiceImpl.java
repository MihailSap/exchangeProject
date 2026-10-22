package ru.urfu.exchangeProject.service.impl;

import ru.urfu.exchangeProject.dto.auth.*;
import ru.urfu.exchangeProject.exception.customEx.news.EmailConfirmationTokenExpiredException;
import ru.urfu.exchangeProject.exception.customEx.news.EmailConfirmationTokenInvalidException;
import ru.urfu.exchangeProject.exception.customEx.news.RateLimitExceededException;
import ru.urfu.exchangeProject.model.jwt.JwtToken;
import ru.urfu.exchangeProject.service.AuthService;

import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.urfu.exchangeProject.exception.customEx.InvalidRefreshTokenException;
import ru.urfu.exchangeProject.exception.customEx.RefreshTokenNotFoundException;
import ru.urfu.exchangeProject.exception.customEx.UserNotFoundException;
import ru.urfu.exchangeProject.model.jwt.RefreshToken;
import ru.urfu.exchangeProject.model.user.User;
import ru.urfu.exchangeProject.service.EmailService;
import ru.urfu.exchangeProject.service.RefreshTokenService;
import ru.urfu.exchangeProject.service.UserService;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
public class AuthServiceImpl implements AuthService {

    private static final Duration EMAIL_CONFIRMATION_TOKEN_TTL =
            Duration.ofHours(24);

    private static final Duration RESEND_CONFIRMATION_INTERVAL =
            Duration.ofMinutes(5);

    private final UserService userService;
    private final EmailService emailService;
    private final RefreshTokenService refreshTokenService;
    private final JwtProvider jwtProvider;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public AuthServiceImpl(
            UserService userService,
            EmailService emailService,
            JwtProvider jwtProvider,
            RefreshTokenService refreshTokenService,
            PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.emailService = emailService;
        this.jwtProvider = jwtProvider;
        this.refreshTokenService = refreshTokenService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    @Override
    public EmailConfirmResponse confirmEmail(String token) {
        User user = userService.getByEmailConfirmationToken(token);

        if (user == null) {
            throw new EmailConfirmationTokenInvalidException();
        }

        if (user.getEmailConfirmationTokenExpiry() == null
                || !user.getEmailConfirmationTokenExpiry().isAfter(Instant.now())) {
            throw new EmailConfirmationTokenExpiredException();
        }

        user.setEmailConfirmed(true);
        user.setEmailConfirmationToken(null);
        user.setEmailConfirmationTokenExpiry(null);
        userService.save(user);

        return new EmailConfirmResponse(true);
    }

    @Transactional
    @Override
    public EmailConfirmResponse confirmEmail(User user) {
        user.setEmailConfirmed(true);
        user.setEmailConfirmationToken(null);
        user.setEmailConfirmationTokenExpiry(null);
        userService.save(user);
        return new EmailConfirmResponse(true);
    }

    @Transactional
    @Override
    public void resendConfirmation() throws UserNotFoundException {
        String email = getAuthenticatedUserEmail();
        User user = userService.getByEmail(email);

        if (user.isEmailConfirmed()) {
            return;
        }

        Instant now = Instant.now();
        Instant lastSentAt = user.getEmailConfirmationLastSentAt();

        if (lastSentAt != null
                && now.isBefore(lastSentAt.plus(RESEND_CONFIRMATION_INTERVAL))) {
            throw new RateLimitExceededException();
        }

        String token = UUID.randomUUID().toString();

        user.setEmailConfirmationToken(token);
        user.setEmailConfirmationTokenExpiry(now.plus(EMAIL_CONFIRMATION_TOKEN_TTL));
        user.setEmailConfirmationLastSentAt(now);

        userService.save(user);
        emailService.sendEmailConfirmEmail(user.getEmail(), token);
    }

    @Override
    public boolean isCredentialsValid(LoginRequest authRequest, User user) {
        return passwordEncoder.matches(authRequest.password(), user.getPassword());
    }

    @Override
    public JwtToken getAccessTokenForUser(User user){
        return jwtProvider.generateAccessToken(user);
    }

    @Transactional
    @Override
    public JwtToken getRefreshTokenForUser(User user){
        JwtToken refreshToken = jwtProvider.generateRefreshToken(user);
        String refreshTokenBody = refreshToken.body();

        if(user.getRefreshToken() != null){
            user.getRefreshToken().setBody(refreshTokenBody);
        } else {
            user.setRefreshToken(new RefreshToken(refreshTokenBody, user));
        }

        userService.save(user);
        return refreshToken;
    }

    @Transactional
    @Override
    public void logout(String refreshTokenBody) throws RefreshTokenNotFoundException {
        RefreshToken refreshToken = refreshTokenService.getByBody(refreshTokenBody);
        User user = refreshToken.getUser();
        user.setRefreshToken(null);
        refreshTokenService.delete(refreshToken);
    }

    @Override
    public JwtResponse getAccessToken(String refreshToken) throws UserNotFoundException, RefreshTokenNotFoundException {
        if (jwtProvider.validateRefreshToken(refreshToken)) {
            final Claims claims = jwtProvider.getRefreshClaims(refreshToken);
            final String email = claims.getSubject();
            User user = userService.getByEmail(email);
            RefreshToken saveRefreshToken = refreshTokenService.getByUser(user);
            if (saveRefreshToken != null && refreshToken.equals(saveRefreshToken.getBody())) {
                final String accessToken = jwtProvider.generateAccessToken(user).body();
                return new JwtResponse(accessToken, null);
            }
        }
        return new JwtResponse(null, null);
    }

    @Transactional
    @Override
    public JwtResponse refresh(String refreshToken)
            throws UserNotFoundException, RefreshTokenNotFoundException, InvalidRefreshTokenException {
        if (jwtProvider.validateRefreshToken(refreshToken)) {
            Claims claims = jwtProvider.getRefreshClaims(refreshToken);
            String email = claims.getSubject();
            User user = userService.getByEmail(email);
            RefreshToken saveRefreshRefreshToken = refreshTokenService.getByUser(user);
            if (refreshToken.equals(saveRefreshRefreshToken.getBody())) {
                String accessToken = jwtProvider.generateAccessToken(user).body();
                String newRefreshToken = jwtProvider.generateRefreshToken(user).body();

                saveRefreshRefreshToken.setBody(newRefreshToken);
                refreshTokenService.save(saveRefreshRefreshToken);
                return new JwtResponse(accessToken, newRefreshToken);
            }
        }
        throw new InvalidRefreshTokenException("Невалидный JWT токен");
    }

    @Override
    public String getAuthenticatedUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getPrincipal().toString();
    }

    @Transactional
    @Override
    public void requestPasswordReset(String email) {
        User user;
        try{
            user = userService.getByEmail(email);
        } catch (Exception ignored){
            return;
        }
        String token = userService.setPasswordResetToken(user);
        emailService.sendPasswordResetEmail(email, token);
    }

    @Transactional
    @Override
    public void resetPassword(PasswordResetRequest request) {
        User user = userService.getByPasswordResetToken(request.token());
        userService.updatePassword(user, request.password());
        userService.setNullPasswordResetToken(user);
    }
}
