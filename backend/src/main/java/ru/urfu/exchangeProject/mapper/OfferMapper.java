package ru.urfu.exchangeProject.mapper;

import org.springframework.stereotype.Component;
import ru.urfu.exchangeProject.dto.offer.OfferLotResponse;
import ru.urfu.exchangeProject.dto.offer.OfferParticipantResponse;
import ru.urfu.exchangeProject.dto.offer.OfferResponse;
import ru.urfu.exchangeProject.model.lot.Lot;
import ru.urfu.exchangeProject.model.offer.Offer;
import ru.urfu.exchangeProject.model.offer.OfferItem;
import ru.urfu.exchangeProject.model.user.User;

import java.util.List;

@Component
public class OfferMapper {

    public OfferResponse mapToOfferResponse(Offer offer) {
        List<OfferLotResponse> offerLots = offer.getItems()
                .stream()
                .map(OfferItem::getLot)
                .map(this::mapToOfferLotResponse)
                .toList();

        return new OfferResponse(
                offer.getId(),
                mapToOfferParticipantResponse(offer.getInitiator()),
                mapToOfferParticipantResponse(offer.getRecipient()),
                mapToOfferLotResponse(offer.getTargetLot()),
                offerLots,
                offer.getStatus(),
                offer.getCreatedAt(),
                offer.getMessage()
        );
    }

    private OfferParticipantResponse mapToOfferParticipantResponse(User user) {
        return new OfferParticipantResponse(
                user.getId(),
                user.getName()
        );
    }

    private OfferLotResponse mapToOfferLotResponse(Lot lot) {
        return new OfferLotResponse(
                lot.getId(),
                lot.getTitle()
        );
    }
}