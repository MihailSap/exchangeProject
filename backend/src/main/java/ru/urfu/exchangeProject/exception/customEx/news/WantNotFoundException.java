package ru.urfu.exchangeProject.exception.customEx.news;

import ru.urfu.exchangeProject.exception.globalEx.NotFoundException;

public class WantNotFoundException extends NotFoundException {
    public WantNotFoundException(String message) {
        super(message);
    }
}
