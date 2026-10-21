package ru.urfu.exchangeProject.dto.category;

import java.util.List;

public record CategoryResponse(
        Long id,
        String name,
        String slug,
        List<CategoryResponse> children
) {
}
