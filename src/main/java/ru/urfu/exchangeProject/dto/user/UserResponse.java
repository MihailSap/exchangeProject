package ru.urfu.exchangeProject.dto.user;


import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import ru.urfu.exchangeProject.model.Role;
import ru.urfu.exchangeProject.model.UserStatus;

import java.time.Instant;

@Schema(name = "Запрос с данными пользователя")
public record UserResponse(
        long id,
        String email,
        String name,
        @JsonProperty("avatar_url")
        String avatarUrl,
        String contacts,
        @JsonProperty("email_confirmed")
        boolean emailConfirmed,
        UserStatus status,
        Instant createdAt,
        Role role
) {
}
