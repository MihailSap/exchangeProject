package ru.urfu.exchangeProject.exception.customEx.news;

public class AccountFrozenException extends RuntimeException {
    public AccountFrozenException(String frozenReason){
        super(frozenReason);
    }
}
