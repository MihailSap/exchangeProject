package ru.urfu.exchangeProject.model.lot.want;

import jakarta.persistence.*;
import ru.urfu.exchangeProject.model.BaseEntity;
import ru.urfu.exchangeProject.model.category.Category;
import ru.urfu.exchangeProject.model.lot.Lot;

import java.time.Instant;

@Entity
@Table(name = "want")
public class Want extends BaseEntity {

    @Enumerated(EnumType.STRING)
    private WantType wantType;
    private String targetLot;
    private String keywords;
    private Instant createdAt;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lot_id", nullable = false)
    private Lot lot;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    public WantType getWantType() {
        return wantType;
    }

    public void setWantType(WantType wantType) {
        this.wantType = wantType;
    }

    public String getTargetLot() {
        return targetLot;
    }

    public void setTargetLot(String targetLot) {
        this.targetLot = targetLot;
    }

    public String getKeywords() {
        return keywords;
    }

    public void setKeywords(String keywords) {
        this.keywords = keywords;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Lot getLot() {
        return lot;
    }

    public void setLot(Lot lot) {
        this.lot = lot;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }
}
