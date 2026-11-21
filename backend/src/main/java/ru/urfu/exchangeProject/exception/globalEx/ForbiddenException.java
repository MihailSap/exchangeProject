package ru.urfu.exchangeProject.exception.globalEx;

import ru.urfu.exchangeProject.dto.exceptions.ErrorCode;

public class ForbiddenException extends RuntimeException{

    private final ErrorCode errorCode;

    public ForbiddenException(ErrorCode errorCode) {
        this.errorCode = errorCode;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
