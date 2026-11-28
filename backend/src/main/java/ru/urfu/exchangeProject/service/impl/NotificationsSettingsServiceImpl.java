package ru.urfu.exchangeProject.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.urfu.exchangeProject.dto.exceptions.ErrorCode;
import ru.urfu.exchangeProject.dto.notifications.NotificationsSettingsUpdateRequest;
import ru.urfu.exchangeProject.exception.customEx.NotFoundException;
import ru.urfu.exchangeProject.model.notification.NotificationsSettings;
import ru.urfu.exchangeProject.model.user.User;
import ru.urfu.exchangeProject.repository.NotificationsSettingsRepository;
import ru.urfu.exchangeProject.service.NotificationsSettingsService;

@Service
public class NotificationsSettingsServiceImpl implements NotificationsSettingsService {

    private final NotificationsSettingsRepository notificationsSettingsRepository;

    @Autowired
    public NotificationsSettingsServiceImpl(NotificationsSettingsRepository notificationsSettingsRepository) {
        this.notificationsSettingsRepository = notificationsSettingsRepository;
    }

    @Transactional(readOnly = true)
    @Override
    public NotificationsSettings getNotificationsSettings(User user){
        return notificationsSettingsRepository.findByUser(user)
                .orElseThrow(() -> new NotFoundException(ErrorCode.NOTIFICATIONS_SETTINGS_NOT_FOUND));
    }

    @Transactional
    @Override
    public NotificationsSettings createDefault(User user){
        NotificationsSettings notificationsSettings = new NotificationsSettings();
        notificationsSettings.setUser(user);
        notificationsSettings.setInfo(true);
        notificationsSettings.setChatMessages(true);
        notificationsSettings.setReviews(true);
        notificationsSettings.setNewOffers(true);
        return notificationsSettingsRepository.save(notificationsSettings);
    }

    @Transactional
    @Override
    public NotificationsSettings update(
            NotificationsSettings notificationsSettings,
            NotificationsSettingsUpdateRequest request
    ){
        Boolean newOffers = request.newOffers();
        if(newOffers != null){
            notificationsSettings.setNewOffers(newOffers);
        }

        Boolean chatMessages = request.chatMessages();
        if(chatMessages != null){
            notificationsSettings.setChatMessages(chatMessages);
        }

        Boolean reviews = request.reviews();
        if(reviews != null){
            notificationsSettings.setReviews(reviews);
        }

        Boolean info = request.info();
        if (info != null) {
            notificationsSettings.setInfo(info);
        }
        return notificationsSettingsRepository.save(notificationsSettings);
    }
}
