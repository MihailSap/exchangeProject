package ru.urfu.exchangeProject.dto.notifications;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;

public record NotificationResponse(
        Long id,
        String type,
        String priority,
        String title,
        String text,
        String link,
        @JsonProperty("is_read")
        boolean isRead,
        @JsonProperty("created_at")
        Instant createdAt
) {
}