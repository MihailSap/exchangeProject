package ru.urfu.exchangeProject.dto.review;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ReviewCreateRequest(
        @NotNull
        @Positive
        Long offerId,
        @NotNull
        @Min(1)
        @Max(5)
        Short rating,
        String text
) {
}
