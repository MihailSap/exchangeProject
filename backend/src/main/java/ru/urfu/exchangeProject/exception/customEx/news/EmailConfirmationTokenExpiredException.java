package ru.urfu.exchangeProject.exception.customEx.news;

public class EmailConfirmationTokenExpiredException extends RuntimeException {
    public EmailConfirmationTokenExpiredException() {
        super("Срок действия токена подтверждения email истек");
    }
}
