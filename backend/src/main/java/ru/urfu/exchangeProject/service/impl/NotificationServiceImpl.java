package ru.urfu.exchangeProject.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.urfu.exchangeProject.dto.exceptions.ErrorCode;
import ru.urfu.exchangeProject.exception.customEx.NotFoundException;
import ru.urfu.exchangeProject.exception.customEx.news.BadRequestException;
import ru.urfu.exchangeProject.model.notification.Notification;
import ru.urfu.exchangeProject.model.user.User;
import ru.urfu.exchangeProject.repository.NotificationRepository;
import ru.urfu.exchangeProject.service.NotificationService;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import jakarta.persistence.criteria.Predicate;

@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    @Autowired
    public NotificationServiceImpl(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional(readOnly = true)
    @Override
    public Notification getById(Long id){
        return notificationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(ErrorCode.NOTIFICATION_NOT_FOUND));
    }

    @Transactional(readOnly = true)
    @Override
    public List<Notification> getUnreadByUser(User user) {
        return notificationRepository.findActualUnreadByUser(
                user,
                Instant.now()
        );
    }

    @Transactional
    @Override
    public void readNotifications(List<Notification> notifications){
        for(Notification notification : notifications){
            notification.setRead(true);
        }
        notificationRepository.saveAll(notifications);
    }

    @Transactional(readOnly = true)
    @Override
    public Page<Notification> getNotificationsByUser(
            User user,
            Boolean isRead,
            String type,
            int page,
            int perPage
    ) {
        if (page < 1 || perPage < 1 || perPage > 100) {
            throw new BadRequestException();
        }

        Instant now = Instant.now();

        type = type != null ? type.trim() : null;

        if (type != null && type.isBlank()) {
            type = null;
        }

        String notificationType = type != null
                ? type.toLowerCase(Locale.ROOT)
                : null;

        Specification<Notification> specification = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(
                    criteriaBuilder.equal(root.get("user"), user)
            );

            if (isRead != null) {
                predicates.add(
                        criteriaBuilder.equal(root.get("isRead"), isRead)
                );
            }

            if (notificationType != null) {
                predicates.add(
                        criteriaBuilder.equal(
                                criteriaBuilder.lower(root.get("type").as(String.class)),
                                notificationType
                        )
                );
            }

            predicates.add(
                    criteriaBuilder.or(
                            criteriaBuilder.isNull(root.get("expiresAt")),
                            criteriaBuilder.greaterThan(
                                    root.<Instant>get("expiresAt"),
                                    now
                            )
                    )
            );

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        Pageable pageable = PageRequest.of(
                page - 1,
                perPage,
                Sort.by(
                        Sort.Order.desc("createdAt"),
                        Sort.Order.desc("id")
                )
        );

        return notificationRepository.findAll(specification, pageable);
    }

    @Transactional(readOnly = true)
    @Override
    public long getUnreadCount(User user) {
        return notificationRepository.countActualUnreadByUser(
                user,
                Instant.now()
        );
    }
}
