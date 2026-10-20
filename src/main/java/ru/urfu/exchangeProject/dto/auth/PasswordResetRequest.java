package ru.urfu.exchangeProject.dto.auth;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;

@Schema(name = "Запрос для смены пароля при восстановлении")
public record PasswordResetRequest(
        String token,
        @Schema(example = "9876543210")
        @Min(value = 8)
        String password) {
}
