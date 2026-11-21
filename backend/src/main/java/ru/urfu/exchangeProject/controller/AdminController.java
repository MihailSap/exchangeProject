package ru.urfu.exchangeProject.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ru.urfu.exchangeProject.PathsConstants;
import ru.urfu.exchangeProject.dto.user.UserFreezeRequest;
import ru.urfu.exchangeProject.dto.user.UserListResponse;
import ru.urfu.exchangeProject.dto.user.UserResponse;
import ru.urfu.exchangeProject.exception.customEx.UserNotFoundException;
import ru.urfu.exchangeProject.exception.customEx.news.UserConflictException;
import ru.urfu.exchangeProject.mapper.UserMapper;
import ru.urfu.exchangeProject.model.user.User;
import ru.urfu.exchangeProject.service.UserService;

import java.util.List;

@Tag(name = "Панель администратора")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAuthority('ADMIN')")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.ADMIN)
public class AdminController {

    private final UserService userService;
    private final UserMapper userMapper;

    @Autowired
    public AdminController(UserService userService, UserMapper userMapper) {
        this.userService = userService;
        this.userMapper = userMapper;
    }

    @Operation(description = "Получение списка пользователей")
    @PreAuthorize("hasAuthority('ADMIN')")
    @GetMapping("/users")
    public UserListResponse getUsers(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "1")
            @Min(1) int page,
            @RequestParam(name = "per_page", defaultValue = "20")
            @Min(1) int perPage
    ) {
        Page<User> userPage = userService.searchUsers(status, q, page, perPage);

        List<UserResponse> userResponses = userPage
                .map(userMapper::mapToUserResponse)
                .getContent();

        return new UserListResponse(
                userResponses, new UserListResponse.Meta(page, perPage, userPage.getTotalElements()));
    }

    @Operation(description = "Заморозка пользователя")
    @PatchMapping("/users/{userId}/freeze")
    public void freezeUser(@PathVariable("userId") long userId, @Valid @RequestBody UserFreezeRequest userFreezeRequest) throws UserNotFoundException {
        User user = userService.getById(userId);
        if(user.getFrozenAt() != null){
            throw new UserConflictException();
        }
        userService.freezeUser(user, userFreezeRequest.reason());
    }

    @Operation(description = "Разморозка пользователя")
    @PatchMapping("/users/{userId}/unfreeze")
    public void unfreezeUser(@PathVariable("userId") long userId) throws UserNotFoundException {
        User user = userService.getById(userId);
        userService.unfreezeUser(user);
    }
}
