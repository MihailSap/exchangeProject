package ru.urfu.exchangeProject.model.lot;

import jakarta.persistence.*;
import ru.urfu.exchangeProject.model.BaseEntity;

import java.time.Instant;

@Entity
@Table(name = "lot_photo")
public class LotPhoto extends BaseEntity {

    private int order;
    private String name;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lot_id", nullable = false)
    private Lot lot;
    private Instant createdAt;

    public int getOrder() {
        return order;
    }

    public void setOrder(int order) {
        this.order = order;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Lot getLot() {
        return lot;
    }

    public void setLot(Lot lot) {
        this.lot = lot;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
