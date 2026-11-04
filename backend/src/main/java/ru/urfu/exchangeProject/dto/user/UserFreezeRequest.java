package ru.urfu.exchangeProject.dto.user;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UserFreezeRequest(
        @NotNull
        @Size(min = 3, max = 500)
        String reason
) {
}
