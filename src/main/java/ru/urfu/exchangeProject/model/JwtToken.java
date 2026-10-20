package ru.urfu.exchangeProject.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;

public record JwtToken(
        String body,
        @JsonProperty("expired_at")
        Instant expiredAt
) {
}
