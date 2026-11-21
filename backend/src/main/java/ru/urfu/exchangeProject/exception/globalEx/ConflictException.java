package ru.urfu.exchangeProject.exception.globalEx;

import ru.urfu.exchangeProject.dto.exceptions.ErrorCode;

public class ConflictException extends RuntimeException {

    private final ErrorCode errorCode;

    public ErrorCode getErrorCode() {
        return errorCode;
    }

    public ConflictException(ErrorCode errorCode) {
        this.errorCode = errorCode;
    }
}
