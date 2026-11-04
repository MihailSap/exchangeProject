package ru.urfu.exchangeProject.dto.lot;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record LotListResponse(
        List<LotResponse> data,
        Meta meta
) {
    public record Meta(
            int page,
            @JsonProperty("per_page")
            int perPage,
            long total
    ) {
    }
}