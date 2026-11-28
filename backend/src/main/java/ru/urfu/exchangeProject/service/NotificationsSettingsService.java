package ru.urfu.exchangeProject.service;

import ru.urfu.exchangeProject.dto.notifications.NotificationsSettingsUpdateRequest;
import ru.urfu.exchangeProject.model.notification.NotificationsSettings;
import ru.urfu.exchangeProject.model.user.User;

public interface NotificationsSettingsService {

    NotificationsSettings getNotificationsSettings(User user);
    NotificationsSettings createDefault(User user);
    NotificationsSettings update(
            NotificationsSettings notificationsSettings,
            NotificationsSettingsUpdateRequest request
    );
}
