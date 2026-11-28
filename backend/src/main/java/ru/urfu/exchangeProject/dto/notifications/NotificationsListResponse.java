package ru.urfu.exchangeProject.dto.notifications;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record NotificationsListResponse(
        List<NotificationResponse> data,
        Meta meta
) {
    public record Meta(
            @JsonProperty("unread_count")
            long unreadCount
    ) {
    }
}