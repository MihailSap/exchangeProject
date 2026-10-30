package ru.urfu.exchangeProject.dto.category;

import jakarta.validation.constraints.NotBlank;

public record CategoryRequest(
        @NotBlank
        String name,
        @NotBlank
        String slug,
        Long parentId,
        Boolean isActive
) {
}
