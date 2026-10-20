package ru.urfu.exchangeProject.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ru.urfu.exchangeProject.PathsConstants;
import ru.urfu.exchangeProject.dto.BaseResponse;
import ru.urfu.exchangeProject.dto.PagedResponse;
import ru.urfu.exchangeProject.dto.user.*;
import ru.urfu.exchangeProject.exception.customEx.UserNotFoundException;
import ru.urfu.exchangeProject.mapper.PageMapper;
import ru.urfu.exchangeProject.mapper.UserMapper;
import ru.urfu.exchangeProject.model.User;
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
    @PatchMapping("/me")
    public BaseResponse<UserProfileResponse> updateCurrentUser(@ModelAttribute UserUpdateRequest userUpdateRequest)
            throws UserNotFoundException {
        String email = authService.getAuthenticatedUserEmail();
        User user = userService.getByEmail(email);
        User updatedUser = userService.update(userUpdateRequest, user);
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



//    @Operation(description = "Смена пароля пользователя")
//    @PatchMapping("/{userId}/password")
//    public String updatePassword(
//            @PathVariable("userId") long userId, @RequestBody UpdatePasswordRequest updatePasswordRequest)
//            throws UserNotFoundException {
//        User user = userService.getById(userId);
//        userService.updatePassword(user, updatePasswordRequest.newPassword());
//        return "Пароль успешно обновлён";
//    }

//    @Operation(description = "Получение всех пользователей с пагинацией")
//    @PreAuthorize("hasAuthority('ADMIN')")
//    @GetMapping
//    public PagedResponse<UserResponse> getAll(
//            @RequestParam(defaultValue = "0") int page,
//            @RequestParam(defaultValue = "10") int size,
//            @RequestParam(required = false) String filter
//    ){
//        Page<UserResponse> users = userService.getAll(page, size, filter)
//                .map(userMapper::mapToUserResponse);
//        return pageMapper.mapToPagedResponse(users);
//    }

//    @Operation(description = "Удаление пользователя")
//    @PreAuthorize("hasAuthority('ADMIN')")
//    @DeleteMapping("/{userId}")
//    public String delete(@PathVariable("userId") long userId)
//            throws UserNotFoundException {
//        User user = userService.getById(userId);
//        userService.delete(user);
//        return "Пользователь удален";
//    }

//    @Operation(description = "Добавление пользователю роли 'ADMIN'")
//    @PreAuthorize("hasAuthority('ADMIN')")
//    @PatchMapping("/{userId}/admin")
//    public UserResponse makeAdmin(@PathVariable("userId") long userId)
//            throws UserNotFoundException {
//        User user = userService.getById(userId);
//        User updatedUser = userService.makeAdmin(user);
//        return userMapper.mapToUserResponse(updatedUser);
//    }
//
//    @Operation(description = "Удаление у пользователя роли 'ADMIN'")
//    @PreAuthorize("hasAuthority('ADMIN')")
//    @PatchMapping("/{userId}/not-admin")
//    public UserResponse makeNotAdmin(@PathVariable("userId") long userId)
//            throws UserNotFoundException {
//        User user = userService.getById(userId);
//        User updatedUser = userService.makeNotAdmin(user);
//        return userMapper.mapToUserResponse(updatedUser);
//    }
}
