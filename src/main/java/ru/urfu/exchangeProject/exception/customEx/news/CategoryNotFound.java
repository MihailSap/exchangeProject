package ru.urfu.exchangeProject.exception.customEx.news;

import ru.urfu.exchangeProject.exception.globalEx.NotFoundException;

public class CategoryNotFound extends NotFoundException {
    public CategoryNotFound(String message) {
        super(message);
    }
}
