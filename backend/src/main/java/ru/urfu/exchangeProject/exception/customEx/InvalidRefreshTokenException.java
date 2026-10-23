package ru.urfu.exchangeProject.exception.customEx;

import ru.urfu.exchangeProject.exception.globalEx.InvalidException;

public class InvalidRefreshTokenException extends InvalidException {
    public InvalidRefreshTokenException(String message) {
        super(message);
    }
}
