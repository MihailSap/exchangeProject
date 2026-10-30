package ru.urfu.exchangeProject.dto.auth;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

@Schema(name = "Запрос для регистрации пользователя")
public record RegisterRequest(
        @Schema(example = "user@mail.com")
        @Email
        String email,
        @Schema(example = "1234567890")
        @Size(min = 8)
        String password,
        @Schema(example = "user")
        String name
) {
}
