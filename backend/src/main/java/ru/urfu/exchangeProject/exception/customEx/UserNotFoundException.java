package ru.urfu.exchangeProject.exception.customEx;

import ru.urfu.exchangeProject.exception.globalEx.NotFoundException;

public class UserNotFoundException extends NotFoundException {
    public UserNotFoundException(String message){
        super(message);
    }
}
