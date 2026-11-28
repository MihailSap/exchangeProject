package ru.urfu.exchangeProject.dto.notifications;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record NotificationsReadRequest(
        @JsonProperty("notification_ids")
        List<Long> notificationIds,
        Boolean all
) {
}
