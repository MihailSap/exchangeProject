package ru.urfu.exchangeProject.dto.offer;

import com.fasterxml.jackson.annotation.JsonProperty;
import ru.urfu.exchangeProject.model.offer.OfferStatus;

import java.time.Instant;
import java.util.List;

public record OfferResponse(
        Long id,
        OfferParticipantResponse initiator,
        OfferParticipantResponse recipient,
        @JsonProperty("target_lot")
        OfferLotResponse targetLot,
        @JsonProperty("offer_lots")
        List<OfferLotResponse> offerLots,
        OfferStatus status,
        Boolean initiatorCompleted,
        Boolean recipientCompleted,
        @JsonProperty("created_at")
        Instant createdAt,
        Instant viewedAt,
        Instant completedAt,
        Instant respondedAt,
        String message
) {
}