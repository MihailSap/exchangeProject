package ru.urfu.exchangeProject.dto.user;

import com.fasterxml.jackson.annotation.JsonProperty;
import ru.urfu.exchangeProject.dto.review.ReviewStatistics;

public record UserShortResponse(
        long id,
        String name,
        @JsonProperty("review_statistics")
        ReviewStatistics reviewStatistics
) {
}
