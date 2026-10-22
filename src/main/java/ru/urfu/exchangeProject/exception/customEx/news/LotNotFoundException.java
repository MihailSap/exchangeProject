package ru.urfu.exchangeProject.exception.customEx.news;

import ru.urfu.exchangeProject.exception.globalEx.NotFoundException;

public class LotNotFoundException extends NotFoundException {
    public LotNotFoundException(String message) {
        super(message);
    }
}
