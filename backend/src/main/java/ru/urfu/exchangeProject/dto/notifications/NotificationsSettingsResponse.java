package ru.urfu.exchangeProject.dto.notifications;

public record NotificationsSettingsResponse(
        boolean newOffers,
        boolean chatMessages,
        boolean reviews,
        boolean info
) {
}
