package ru.urfu.exchangeProject.dto.moderation;

import jakarta.validation.constraints.NotNull;

public record RejectRequest(
        @NotNull
        String reason
) {
}
