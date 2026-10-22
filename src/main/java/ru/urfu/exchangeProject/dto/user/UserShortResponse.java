package ru.urfu.exchangeProject.dto.user;

public record UserShortResponse(
        long id,
        String name,
        Double rating
) {
}
