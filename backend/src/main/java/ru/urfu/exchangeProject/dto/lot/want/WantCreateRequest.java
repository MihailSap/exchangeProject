package ru.urfu.exchangeProject.dto.lot.want;

import com.fasterxml.jackson.annotation.JsonProperty;
import ru.urfu.exchangeProject.model.lot.want.WantType;

public record WantCreateRequest(
        @JsonProperty("want_type")
        WantType wantType,
        String keywords,
        @JsonProperty("target_category_id")
        Long targetCategoryId,
        @JsonProperty("target_lot")
        String targetLot
) {
}
