package ru.urfu.exchangeProject.mapper;

import org.springframework.stereotype.Component;
import ru.urfu.exchangeProject.dto.notifications.NotificationResponse;
import ru.urfu.exchangeProject.dto.notifications.NotificationsSettingsResponse;
import ru.urfu.exchangeProject.model.notification.Notification;
import ru.urfu.exchangeProject.model.notification.NotificationsSettings;

import java.util.Locale;

@Component
public class NotificationMapper {

    public NotificationsSettingsResponse mapToNotificationsSettingsResponse(
            NotificationsSettings notificationsSettings){
        return new NotificationsSettingsResponse(
                notificationsSettings.isNewOffers(),
                notificationsSettings.isChatMessages(),
                notificationsSettings.isReviews(),
                notificationsSettings.isInfo()
        );
    }

    public NotificationResponse mapToNotificationResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType().toString().toLowerCase(Locale.ROOT),
                notification.getPriority().toString().toLowerCase(Locale.ROOT),
                notification.getTitle(),
                notification.getText(),
                notification.getLink(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
