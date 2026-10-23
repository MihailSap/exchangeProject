package ru.urfu.exchangeProject.service;

import jakarta.security.auth.message.AuthException;
import ru.urfu.exchangeProject.dto.auth.*;
import ru.urfu.exchangeProject.exception.customEx.InvalidRefreshTokenException;
import ru.urfu.exchangeProject.exception.customEx.RefreshTokenNotFoundException;
import ru.urfu.exchangeProject.exception.customEx.UserNotFoundException;
import ru.urfu.exchangeProject.model.jwt.JwtToken;
import ru.urfu.exchangeProject.model.user.User;

public interface AuthService {

    boolean isCredentialsValid(LoginRequest authRequest, User user);

    JwtToken getAccessTokenForUser(User user);

    JwtToken getRefreshTokenForUser(User user);

    void logout(String refreshTokenBody) throws RefreshTokenNotFoundException;

    JwtResponse getAccessToken(String refreshToken) throws UserNotFoundException, RefreshTokenNotFoundException;

    JwtResponse refresh(String refreshToken) throws AuthException, UserNotFoundException, RefreshTokenNotFoundException, InvalidRefreshTokenException;

    String getAuthenticatedUserEmail();

    User register(RegisterRequest request);

    void requestPasswordReset(String email);

    void resetPassword(PasswordResetRequest request);

    EmailConfirmResponse confirmEmail(String token);

    EmailConfirmResponse confirmEmail(User user);

    void resendConfirmation() throws UserNotFoundException;
}
