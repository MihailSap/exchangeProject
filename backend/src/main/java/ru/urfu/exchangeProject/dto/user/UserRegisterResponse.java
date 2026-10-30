package ru.urfu.exchangeProject.dto.user;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;

public record UserRegisterResponse(
        long id,
        String email,
        String name,
        @JsonProperty("email_confirmed")
        boolean emailConfirmed,
        @JsonProperty("created_at")
        Instant createdAt
) {
}
