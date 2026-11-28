package ru.urfu.exchangeProject.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.exchangeProject.model.notification.NotificationsSettings;
import ru.urfu.exchangeProject.model.user.User;

import java.util.Optional;

@Repository
public interface NotificationsSettingsRepository extends JpaRepository<NotificationsSettings, Long> {

    Optional<NotificationsSettings> findByUser(User user);
}
