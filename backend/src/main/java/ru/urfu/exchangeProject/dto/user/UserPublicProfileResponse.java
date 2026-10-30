package ru.urfu.exchangeProject.dto.user;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;

@Schema(name = "Публичный профиль пользователя")
public record UserPublicProfileResponse(
        long id,
        String name,
        @JsonProperty("avatar_url")
        String avatarUrl,
        String region,
        String contacts,
        @JsonProperty("email_confirmed")
        boolean emailConfirmed,
        Double rating,
        @JsonProperty("reviews_count")
        int reviewsCount,
        @JsonProperty("created_at")
        Instant createdAt,
        @JsonProperty("active_lots")
        List<Object> activeLots, //FIXME
        @JsonProperty("recent_reviews")
        List<Object> recentReviews //FIXME
) {
}
