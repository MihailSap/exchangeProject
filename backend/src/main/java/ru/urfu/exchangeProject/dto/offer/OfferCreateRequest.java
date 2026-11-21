package ru.urfu.exchangeProject.dto.offer;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record OfferCreateRequest(
        @JsonProperty("target_lot_id")
        Long targetLotId,
        @JsonProperty("offer_lot_ids")
        List<Long> offeredLotIds,
        String message
) {
}