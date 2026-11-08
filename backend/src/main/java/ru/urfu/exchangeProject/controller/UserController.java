package ru.urfu.exchangeProject.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import ru.urfu.exchangeProject.PathsConstants;
import ru.urfu.exchangeProject.dto.BaseResponse;
import ru.urfu.exchangeProject.dto.user.*;
import ru.urfu.exchangeProject.exception.customEx.UserNotFoundException;
import ru.urfu.exchangeProject.mapper.PageMapper;
import ru.urfu.exchangeProject.mapper.UserMapper;
import ru.urfu.exchangeProject.model.user.User;
import ru.urfu.exchangeProject.service.AuthService;
import ru.urfu.exchangeProject.service.UserService;

@Tag(name = "Управление пользователями")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.USERS)
public class UserController {

    private final AuthService authService;
    private final UserService userService;
    private final UserMapper userMapper;
    private final PageMapper pageMapper;

    @Autowired
    public UserController(
            AuthService authService,
            UserService userService,
            UserMapper userMapper,
            PageMapper pageMapper
    ) {
        this.authService = authService;
        this.userService = userService;
        this.userMapper = userMapper;
        this.pageMapper = pageMapper;
    }

    @Operation(description = "Получение профиля текущего пользователя")
    @GetMapping("/me")
    public BaseResponse<UserProfileResponse> getCurrentUser() throws UserNotFoundException {
        String email = authService.getAuthenticatedUserEmail();
        User user = userService.getByEmail(email);
        UserProfileResponse userProfileResponse = userMapper.mapToUserProfileResponse(user);
        return new BaseResponse<>(userProfileResponse);
    }

    @Operation(description = "Обновление профиля текущего пользователя")
    @PatchMapping(value = "/me", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public BaseResponse<UserProfileResponse> updateCurrentUser(@Valid @ModelAttribute UserUpdateRequest userUpdateRequest)
            throws UserNotFoundException {
        String email = authService.getAuthenticatedUserEmail();
        User user = userService.getByEmail(email);
        User updatedUser = userService.update(userUpdateRequest, user);
        UserProfileResponse userProfileResponse = userMapper.mapToUserProfileResponse(updatedUser);
        return new BaseResponse<>(userProfileResponse);
    }

    @Operation(description = "Удаление аватара текущего пользователя")
    @DeleteMapping("/me/avatar")
    public BaseResponse<UserProfileResponse> deleteAvatar() throws UserNotFoundException {
        String email = authService.getAuthenticatedUserEmail();
        User user = userService.getByEmail(email);
        User updatedUser = userService.deleteAvatar(user);
        UserProfileResponse userProfileResponse = userMapper.mapToUserProfileResponse(updatedUser);
        return new BaseResponse<>(userProfileResponse);
    }

    @Operation(description = "Получение публичного профиля пользователя")
    @GetMapping("/{userId}")
    public BaseResponse<UserPublicProfileResponse> getUserPublicProfile(@PathVariable("userId") long userId)
            throws UserNotFoundException {
        User user = userService.getById(userId);
        UserPublicProfileResponse userPublicProfileResponse =
                userMapper.mapToUserPublicProfileResponse(user);
        return new BaseResponse<>(userPublicProfileResponse);
    }
}
