package ru.urfu.exchangeProject.exception.customEx;

import ru.urfu.exchangeProject.exception.globalEx.NotFoundException;

public class RefreshTokenNotFoundException extends NotFoundException {
    public RefreshTokenNotFoundException(String message) {
        super(message);
    }
}
