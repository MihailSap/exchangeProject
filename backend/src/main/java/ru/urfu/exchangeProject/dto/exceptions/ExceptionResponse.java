package ru.urfu.exchangeProject.dto.exceptions;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ExceptionResponse(ExceptionErrorResponse error) {
}
