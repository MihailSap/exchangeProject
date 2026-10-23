package ru.urfu.exchangeProject.dto.auth;

import com.fasterxml.jackson.annotation.JsonProperty;

public record EmailConfirmResponse(
        @JsonProperty("email_Confirmed")
        boolean emailConfirmed
) {
}
