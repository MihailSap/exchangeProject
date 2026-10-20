package ru.urfu.exchangeProject.dto.exceptions;

import java.util.List;

public record ExceptionErrorResponse(ErrorCode code, String message, List<ExceptionDetails> details) {
}
