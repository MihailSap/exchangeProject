package ru.urfu.exchangeProject.dto.auth;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "Запрос для обновления refresh-токена")
public record RefreshJwtRequest(String refreshToken) {
}
