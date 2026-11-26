package ru.urfu.exchangeProject.dto.review;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ReviewStatistics(
        Double rating,
        @JsonProperty("reviews_count")
        Long reviewsCount
) {
}