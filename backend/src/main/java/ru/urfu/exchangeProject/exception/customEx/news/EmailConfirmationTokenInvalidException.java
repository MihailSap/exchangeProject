package ru.urfu.exchangeProject.exception.customEx.news;

public class EmailConfirmationTokenInvalidException extends RuntimeException {
    public EmailConfirmationTokenInvalidException() {
        super("Невалидный токен подтверждения email");
    }
}
