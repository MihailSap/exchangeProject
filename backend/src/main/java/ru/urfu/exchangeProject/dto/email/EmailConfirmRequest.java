package ru.urfu.exchangeProject.dto.email;

import jakarta.validation.constraints.NotBlank;

public record EmailConfirmRequest(
        @NotBlank String token
) {
}
