package ru.urfu.exchangeProject.dto.email;

import com.fasterxml.jackson.annotation.JsonProperty;

public record EmailConfirmResponse(
        @JsonProperty("email_confirmed")
        boolean emailConfirmed
) {
}
