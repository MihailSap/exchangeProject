package ru.urfu.exchangeProject.exception.customEx.news;

import ru.urfu.exchangeProject.exception.globalEx.NotFoundException;

public class LotPhotoNotFoundException extends NotFoundException {
    public LotPhotoNotFoundException(String message) {
        super(message);
    }
}
