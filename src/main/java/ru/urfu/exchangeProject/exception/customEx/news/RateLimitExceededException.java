package ru.urfu.exchangeProject.exception.customEx.news;

public class RateLimitExceededException extends RuntimeException {
    public RateLimitExceededException() {
        super("Повторно отправить письмо можно не чаще одного раза в 5 минут");
    }
}
