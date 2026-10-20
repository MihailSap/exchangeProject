package ru.urfu.exchangeProject.dto.auth;

import ru.urfu.exchangeProject.model.UserStatus;

public record UserLoginResponse(long id, String name, UserStatus status) {
}
