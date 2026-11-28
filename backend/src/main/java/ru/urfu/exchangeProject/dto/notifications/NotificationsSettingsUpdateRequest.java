package ru.urfu.exchangeProject.dto.notifications;

public record NotificationsSettingsUpdateRequest(
        Boolean newOffers,
        Boolean chatMessages,
        Boolean reviews,
        Boolean info
) {
}
