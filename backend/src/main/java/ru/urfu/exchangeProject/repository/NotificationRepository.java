package ru.urfu.exchangeProject.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ru.urfu.exchangeProject.model.notification.Notification;
import ru.urfu.exchangeProject.model.user.User;

import java.time.Instant;
import java.util.List;

@Repository
public interface NotificationRepository extends
        JpaRepository<Notification, Long>,
        JpaSpecificationExecutor<Notification> {
    @Query("""
            SELECT n FROM Notification n
            WHERE n.user = :user
            AND n.isRead = false
            AND (n.expiresAt IS NULL OR n.expiresAt > :now)
            """)
    List<Notification> findActualUnreadByUser(
            @Param("user") User user,
            @Param("now") Instant now
    );

    @Query("""
            SELECT COUNT(n) FROM Notification n
            WHERE n.user = :user
            AND n.isRead = false
            AND (n.expiresAt IS NULL OR n.expiresAt > :now)
            """)
    long countActualUnreadByUser(
            @Param("user") User user,
            @Param("now") Instant now
    );
}