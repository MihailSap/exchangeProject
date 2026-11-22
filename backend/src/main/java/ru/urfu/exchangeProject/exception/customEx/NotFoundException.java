package ru.urfu.exchangeProject.exception.customEx;

import ru.urfu.exchangeProject.dto.exceptions.ErrorCode;

public class NotFoundException extends RuntimeException {

    private final ErrorCode errorCode;

    public NotFoundException(ErrorCode errorCode) {
        this.errorCode = errorCode;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
