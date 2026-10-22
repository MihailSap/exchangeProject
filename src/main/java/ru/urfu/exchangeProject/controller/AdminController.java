package ru.urfu.exchangeProject.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ru.urfu.exchangeProject.PathsConstants;
import ru.urfu.exchangeProject.dto.user.UserFreezeRequest;
import ru.urfu.exchangeProject.exception.customEx.UserNotFoundException;
import ru.urfu.exchangeProject.model.user.User;
import ru.urfu.exchangeProject.service.UserService;

@Tag(name = "Панель администратора")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAuthority('ADMIN')")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.ADMIN)
public class AdminController {

    private final UserService userService;

    @Autowired
    public AdminController(UserService userService) {
        this.userService = userService;
    }

    @Operation(description = "Заморозка пользователя")
    @PatchMapping("/users/{userId}/freeze")
    public void freezeUser(@PathVariable("userId") long userId, @RequestBody UserFreezeRequest userFreezeRequest) throws UserNotFoundException {
        User user = userService.getById(userId);
        userService.freezeUser(user, userFreezeRequest.reason());
    }

    @Operation(description = "Разморозка пользователя")
    @PatchMapping("/users/{userId}/unfreeze")
    public void unfreezeUser(@PathVariable("userId") long userId) throws UserNotFoundException {
        User user = userService.getById(userId);
        userService.unfreezeUser(user);
    }
}
