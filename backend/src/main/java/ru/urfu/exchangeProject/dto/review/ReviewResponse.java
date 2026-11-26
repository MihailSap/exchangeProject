package ru.urfu.exchangeProject.dto.review;

import java.time.Instant;

public record ReviewResponse(
        Long id,
        Long authorId,
        Long recipientId,
        Long lotId,
        Long offerId,
        Short rating,
        String text,
        Instant createdAt,
        Instant updatedAt,
        Instant lockedAt
) {
}
