package ru.urfu.exchangeProject.dto.lot;

import com.fasterxml.jackson.annotation.JsonProperty;
import ru.urfu.exchangeProject.dto.category.CategoryTargetResponse;
import ru.urfu.exchangeProject.dto.user.UserShortResponse;
import ru.urfu.exchangeProject.dto.lot.want.WantResponse;
import ru.urfu.exchangeProject.model.lot.DeliveryMethod;
import ru.urfu.exchangeProject.model.lot.LotStatus;
import ru.urfu.exchangeProject.model.lot.LotType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record LotResponse(
        long id,
        String title,
        String description,
        LotType type,
        @JsonProperty("delivery_method")
        DeliveryMethod deliveryMethod,
        @JsonProperty("estimated_cost")
        BigDecimal estimatedCost,
        CategoryTargetResponse category,
        String region,
        List<LotPhotoDataResponse> photos,
        UserShortResponse owner,
        List<WantResponse> wants,
        LotStatus status,
        @JsonProperty("published_at")
        Instant publishedAt,
        @JsonProperty("expires_at")
        Instant expiresAt
) {
}
