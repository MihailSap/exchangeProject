package ru.urfu.exchangeProject.exception.globalEx;

import ru.urfu.exchangeProject.dto.exceptions.ErrorCode;

public class UnauthorizedException extends RuntimeException {

    private final ErrorCode errorCode;

    public UnauthorizedException(ErrorCode errorCode) {
        this.errorCode = errorCode;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
