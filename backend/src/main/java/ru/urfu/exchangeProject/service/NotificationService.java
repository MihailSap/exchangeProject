package ru.urfu.exchangeProject.service;

import org.springframework.data.domain.Page;
import ru.urfu.exchangeProject.model.notification.Notification;
import ru.urfu.exchangeProject.model.user.User;

import java.util.List;

public interface NotificationService {
    Notification getById(Long id);
    List<Notification> getUnreadByUser(User user);
    void readNotifications(List<Notification> notifications);
    Page<Notification> getNotificationsByUser(
            User user,
            Boolean isRead,
            String type,
            int page,
            int perPage
    );
    long getUnreadCount(User user);
}
