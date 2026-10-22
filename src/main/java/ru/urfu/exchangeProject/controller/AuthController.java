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

@Tag(name = "Управление аутентификацией")
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
    public BaseResponse<UserResponse> register(@RequestBody @Valid RegisterRequest request) {
        if(userService.isExistsByEmail(request.email())){
            throw new EmailExistsException();
        }
        User user = userService.create(request);
        UserResponse userResponse = userMapper.mapToUserResponse(user);
        return new BaseResponse<>(userResponse);
    }

    @Operation(description = "Вход пользователя в существующий аккаунт, получение токенов")
    @PostMapping("/login")
    public BaseResponse<LoginResponse> login(@RequestBody LoginRequest authRequest)
            throws AuthException, UserNotFoundException {
        User user = userService.getByEmail(authRequest.email());
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

//    @SecurityRequirement(name = "bearerAuth")
//    @Operation(description = "Подтверждение email по токену")
//    @PostMapping("/confirm-email")
//    public EmailConfirmResponse confirmEmail(){
//        //TODO
//        return null;
//    }
//
//    @SecurityRequirement(name = "bearerAuth")
//    @Operation(description = "Повторная отправка письма")
//    @PostMapping("/resend-confirmation")
//    public void resendConfirmation(){
//        //TODO
//    }
}
