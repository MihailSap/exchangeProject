package ru.urfu.exchangeProject.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.security.auth.message.AuthException;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ru.urfu.exchangeProject.PathsConstants;
import ru.urfu.exchangeProject.dto.BaseResponse;
import ru.urfu.exchangeProject.dto.auth.*;
import ru.urfu.exchangeProject.dto.email.EmailConfirmRequest;
import ru.urfu.exchangeProject.dto.user.UserRegisterResponse;
import ru.urfu.exchangeProject.dto.user.UserResponse;
import ru.urfu.exchangeProject.exception.customEx.*;
import ru.urfu.exchangeProject.exception.customEx.news.AccountFrozenException;
import ru.urfu.exchangeProject.exception.customEx.news.EmailExistsException;
import ru.urfu.exchangeProject.exception.customEx.news.InvalidCredentialsException;
import ru.urfu.exchangeProject.mapper.UserMapper;
import ru.urfu.exchangeProject.model.jwt.JwtToken;
import ru.urfu.exchangeProject.model.user.User;
import ru.urfu.exchangeProject.model.user.UserStatus;
import ru.urfu.exchangeProject.service.AuthService;
import ru.urfu.exchangeProject.service.UserService;

@Tag(name = "Аутентификация")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.AUTH)
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final UserMapper userMapper;

    @Autowired
    public AuthController(
            AuthService authService,
            UserService userService,
            UserMapper userMapper
    ) {
        this.authService = authService;
        this.userService = userService;
        this.userMapper = userMapper;
    }

    @Operation(description = "Регистрация нового пользователя по электронной почте")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/register")
    public BaseResponse<UserRegisterResponse> register(@RequestBody @Valid RegisterRequest request) {
        if(userService.isExistsByEmail(request.email())){
            throw new EmailExistsException();
        }
        User user = userService.create(request);
        UserRegisterResponse userResponse = userMapper.mapToUserRegisterResponse(user);
        return new BaseResponse<>(userResponse);
    }

    @Operation(description = "Вход пользователя в существующий аккаунт, получение токенов")
    @PostMapping("/login")
    public BaseResponse<LoginResponse> login(@RequestBody LoginRequest authRequest) {
        User user;
        try {
            user = userService.getByEmail(authRequest.email());
        } catch (UserNotFoundException exception){
            throw new InvalidCredentialsException();
        }

        if(!authService.isCredentialsValid(authRequest, user)){
            throw new InvalidCredentialsException();
        }
        if(UserStatus.FROZEN.equals(user.getStatus())){
            throw new AccountFrozenException(user.getFrozenReason());
        }

        JwtToken accessToken = authService.getAccessTokenForUser(user);
        JwtToken refreshToken = authService.getRefreshTokenForUser(user);
        UserLoginResponse mappedUser = userMapper.mapToUserLoginResponse(user);
        LoginResponse loginResponse = new LoginResponse(accessToken, refreshToken, mappedUser);
        return new BaseResponse<>(loginResponse);
    }

    @Operation(description = "Получение нового access-токена по refresh-токену")
    @PostMapping("/token")
    public BaseResponse<JwtResponse> getNewAccessToken(@RequestBody RefreshJwtRequest request)
            throws UserNotFoundException, RefreshTokenNotFoundException {
        JwtResponse jwtResponse = authService.getAccessToken(request.refreshToken());
        return new BaseResponse<>(jwtResponse);
    }

    @SecurityRequirement(name = "bearerAuth")
    @Operation(description = "Замена использованного refresh-токена на новый")
    @PostMapping("/refresh")
    public BaseResponse<JwtResponse> getNewRefreshToken(@RequestBody RefreshJwtRequest request)
            throws AuthException, UserNotFoundException, InvalidRefreshTokenException, RefreshTokenNotFoundException {
        JwtResponse jwtResponse = authService.refresh(request.refreshToken());
        return new BaseResponse<>(jwtResponse);
    }

    @SecurityRequirement(name = "bearerAuth")
    @Operation(description = "Выход пользователя из аккаунта - удаление токенов")
    @PostMapping("/logout")
    public void logout(@RequestBody RefreshJwtRequest request)
            throws RefreshTokenNotFoundException {
        authService.logout(request.refreshToken());
    }

    @Operation(description = "Запрос сброса пароля")
    @PostMapping("/forgot-password")
    public void requestForResetPassword(@RequestBody ForgotPasswordRequest forgotPasswordRequest) {
        authService.requestPasswordReset(forgotPasswordRequest.email());
    }

    @Operation(description = "Смена пароля при восстановлении")
    @PostMapping("/reset-password")
    public void resetPassword(@RequestBody @Valid PasswordResetRequest resetPasswordDTO) {
        authService.resetPassword(resetPasswordDTO);
    }

    @Operation(description = "Подтверждение email по токену")
    @PostMapping("/confirm-email")
    public BaseResponse<EmailConfirmResponse> confirmEmail(
            @RequestBody @Valid EmailConfirmRequest request) {
        EmailConfirmResponse response = authService.confirmEmail(request.token());
        return new BaseResponse<>(response);
    }

    @Operation(description = "Повторная отправка письма для подтверждения email")
    @PostMapping("/resend-confirmation")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resendConfirmation() throws UserNotFoundException {
        authService.resendConfirmation();
    }

    @SecurityRequirement(name = "bearerAuth")
    @Operation(description = "Моковое подтверждение email")
    @PostMapping("/confirm-email/mock")
    public BaseResponse<EmailConfirmResponse> confirmEmailMock() throws UserNotFoundException {
        String email = authService.getAuthenticatedUserEmail();
        User user = userService.getByEmail(email);

        EmailConfirmResponse response = authService.confirmEmail(user);
        return new BaseResponse<>(response);
    }
}
