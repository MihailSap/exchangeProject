package ru.urfu.exchangeProject.dto.user;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import ru.urfu.exchangeProject.model.user.UserStatus;

import java.time.Instant;

@Schema(name = "Профиль текущего пользователя")
public record UserProfileResponse(
        long id,
        String email,
        String name,
        @JsonProperty("avatar_url")
        String avatarUrl,
        String region,
        String contacts,
        @JsonProperty("email_confirmed")
        boolean emailConfirmed,
        UserStatus status,
        Double rating,
        @JsonProperty("reviews_count")
        int reviewsCount,
        @JsonProperty("created_at")
        Instant createdAt
) {
}
