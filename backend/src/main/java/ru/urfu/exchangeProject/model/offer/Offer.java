package ru.urfu.exchangeProject.model.offer;

import jakarta.persistence.*;
import ru.urfu.exchangeProject.model.BaseEntity;
import ru.urfu.exchangeProject.model.lot.Lot;
import ru.urfu.exchangeProject.model.user.User;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "offers")
public class Offer extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "initiator_id", nullable = false)
    private User initiator;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "target_lot_id", nullable = false)
    private Lot targetLot;
    @OneToMany(mappedBy = "offer", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OfferItem> items = new ArrayList<>();
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private OfferStatus status;
    @Column(name = "message", columnDefinition = "text")
    private String message;
    private Boolean initiatorCompleted;
    private Boolean recipientCompleted;
    private Instant createdAt;
    private Instant viewedAt;
    private Instant respondedAt;
    private Instant completedAt;

    public void addItem(Lot lot) {
        OfferItem offerItem = new OfferItem();
        offerItem.setOffer(this);
        offerItem.setLot(lot);
        items.add(offerItem);
    }

    public User getInitiator() {
        return initiator;
    }

    public void setInitiator(User initiator) {
        this.initiator = initiator;
    }

    public User getRecipient() {
        return recipient;
    }

    public void setRecipient(User recipient) {
        this.recipient = recipient;
    }

    public Lot getTargetLot() {
        return targetLot;
    }

    public void setTargetLot(Lot targetLot) {
        this.targetLot = targetLot;
    }

    public OfferStatus getStatus() {
        return status;
    }

    public void setStatus(OfferStatus status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getViewedAt() {
        return viewedAt;
    }

    public void setViewedAt(Instant viewedAt) {
        this.viewedAt = viewedAt;
    }

    public Instant getRespondedAt() {
        return respondedAt;
    }

    public void setRespondedAt(Instant respondedAt) {
        this.respondedAt = respondedAt;
    }

    public Instant getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(Instant completedAt) {
        this.completedAt = completedAt;
    }

    public List<OfferItem> getItems() {
        return items;
    }

    public void setItems(List<OfferItem> items) {
        this.items = items;
    }

    public Boolean getInitiatorCompleted() {
        return initiatorCompleted;
    }

    public void setInitiatorCompleted(Boolean initiatorCompleted) {
        this.initiatorCompleted = initiatorCompleted;
    }

    public Boolean getRecipientCompleted() {
        return recipientCompleted;
    }

    public void setRecipientCompleted(Boolean recipientCompleted) {
        this.recipientCompleted = recipientCompleted;
    }
}
