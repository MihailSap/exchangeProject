package ru.urfu.exchangeProject.model.notification;

import jakarta.persistence.*;
import ru.urfu.exchangeProject.model.BaseEntity;
import ru.urfu.exchangeProject.model.user.User;

@Entity
@Table(name = "notifications_settings")
public class NotificationsSettings extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
    private boolean newOffers;
    private boolean chatMessages;
    private boolean reviews;
    private boolean info;

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public boolean isNewOffers() {
        return newOffers;
    }

    public void setNewOffers(boolean newOffers) {
        this.newOffers = newOffers;
    }

    public boolean isChatMessages() {
        return chatMessages;
    }

    public void setChatMessages(boolean chatMessages) {
        this.chatMessages = chatMessages;
    }

    public boolean isReviews() {
        return reviews;
    }

    public void setReviews(boolean reviews) {
        this.reviews = reviews;
    }

    public boolean isInfo() {
        return info;
    }

    public void setInfo(boolean info) {
        this.info = info;
    }
}
