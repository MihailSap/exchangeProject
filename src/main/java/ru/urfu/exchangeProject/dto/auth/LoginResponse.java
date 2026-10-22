package ru.urfu.exchangeProject.dto.auth;

import com.fasterxml.jackson.annotation.JsonProperty;
import ru.urfu.exchangeProject.model.jwt.JwtToken;

public record LoginResponse(
        @JsonProperty("access_token")
        JwtToken accessToken,
        @JsonProperty("refresh_token")
        JwtToken refreshToken,
        UserLoginResponse user
) {
}
