package ru.urfu.exchangeProject.dto.auth;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(name = "Запрос для смены пароля при восстановлении")
public record PasswordResetRequest(
        @NotBlank
        String token,
        @Schema(example = "9876543210")
        @NotBlank
        @Size(min = 8, max = 128)
        String password) {
}
