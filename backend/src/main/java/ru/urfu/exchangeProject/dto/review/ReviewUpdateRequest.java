package ru.urfu.exchangeProject.dto.review;

public record ReviewUpdateRequest(
        Short rating,
        String text
) {
}
