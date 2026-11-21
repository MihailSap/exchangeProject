package ru.urfu.exchangeProject.model.offer;

import jakarta.persistence.*;
import ru.urfu.exchangeProject.model.BaseEntity;
import ru.urfu.exchangeProject.model.lot.Lot;

@Entity
@Table(name = "offer_items")
public class OfferItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "offer_id")
    private Offer offer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lot_id", nullable = false)
    private Lot lot;

    public Offer getOffer() {
        return offer;
    }

    public void setOffer(Offer offer) {
        this.offer = offer;
    }

    public Lot getLot() {
        return lot;
    }

    public void setLot(Lot lot) {
        this.lot = lot;
    }
}
