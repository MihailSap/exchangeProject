package ru.urfu.exchangeProject.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;
import ru.urfu.exchangeProject.PathsConstants;
import ru.urfu.exchangeProject.dto.BaseResponse;
import ru.urfu.exchangeProject.dto.notifications.*;
import ru.urfu.exchangeProject.exception.customEx.news.BadRequestException;
import ru.urfu.exchangeProject.mapper.NotificationMapper;
import ru.urfu.exchangeProject.model.notification.Notification;
import ru.urfu.exchangeProject.model.notification.NotificationsSettings;
import ru.urfu.exchangeProject.model.user.User;
import ru.urfu.exchangeProject.service.AuthService;
import ru.urfu.exchangeProject.service.NotificationService;
import ru.urfu.exchangeProject.service.NotificationsSettingsService;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Tag(name = "Уведомления")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.NOTIFICATIONS)
public class NotificationController {

    private final AuthService authService;
    private final NotificationService notificationService;
    private final NotificationsSettingsService notificationsSettingsService;
    private final NotificationMapper notificationMapper;

    @Autowired
    public NotificationController(
            AuthService authService,
            NotificationService notificationService,
            NotificationsSettingsService notificationsSettingsService,
            NotificationMapper notificationMapper
    ) {
        this.authService = authService;
        this.notificationService = notificationService;
        this.notificationsSettingsService = notificationsSettingsService;
        this.notificationMapper = notificationMapper;
    }

    @Operation(description = "Получение уведомлений текущего пользователя")
    @GetMapping
    public NotificationsListResponse getNotifications(
            @RequestParam(name = "is_read", required = false) Boolean isRead,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(name = "per_page", defaultValue = "20") int perPage
    ) {
        User user = authService.getAuthenticatedUser();
        Page<Notification> notificationPage = notificationService.getNotificationsByUser(
                user, isRead, type, page, perPage);

        List<NotificationResponse> notifications = notificationPage
                .map(notificationMapper::mapToNotificationResponse)
                .getContent();

        long unreadCount = notificationService.getUnreadCount(user);
        return new NotificationsListResponse(
                notifications, new NotificationsListResponse.Meta(unreadCount));
    }

    @Operation(description = "Чтение уведомлений")
    @PostMapping("/read")
    public void read(@RequestBody NotificationsReadRequest request){
        User user = authService.getAuthenticatedUser();
        List<Notification> notifications = new ArrayList<>();
        if(request.all()){
            notifications = notificationService.getUnreadByUser(user);
            if(notifications.isEmpty()){
                throw new BadRequestException();
            }
        } else {
            List<Long> notificationIds = request.notificationIds();
            if(notificationIds == null || notificationIds.isEmpty()){
                throw new BadRequestException();
            }
            for(Long notificationId : notificationIds){
                Notification notification = notificationService.getById(notificationId);
                if(notification.isRead()
                        || (notification.getExpiresAt() != null && notification.getExpiresAt().isBefore(Instant.now()))){
                    throw new BadRequestException();
                }
                notifications.add(notification);
            }
        }
        notificationService.readNotifications(notifications);
    }

    @Operation(description = "Получение настроек уведомлений текущего пользователя")
    @GetMapping("/settings")
    public BaseResponse<NotificationsSettingsResponse> getSettings(){
        User authenticatedUser = authService.getAuthenticatedUser();
        NotificationsSettings notificationsSettings =
                notificationsSettingsService.getNotificationsSettings(authenticatedUser);
        NotificationsSettingsResponse response =
                notificationMapper.mapToNotificationsSettingsResponse(notificationsSettings);
        return new BaseResponse<>(response);
    }

    @Operation(description = "Обновление настроек уведомлений текущего пользователя")
    @PatchMapping("/settings")
    public BaseResponse<NotificationsSettingsResponse> updateSettings(
            @RequestBody NotificationsSettingsUpdateRequest request){
        User authenticatedUser = authService.getAuthenticatedUser();
        NotificationsSettings notificationsSettings =
                notificationsSettingsService.getNotificationsSettings(authenticatedUser);
        NotificationsSettings updatedSettings =
                notificationsSettingsService.update(notificationsSettings, request);
        NotificationsSettingsResponse response =
                notificationMapper.mapToNotificationsSettingsResponse(updatedSettings);
        return new BaseResponse<>(response);
    }
}
