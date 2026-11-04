package ru.urfu.exchangeProject.dto.category;

import jakarta.validation.constraints.Size;

public record CategoryUpdateRequest(
        @Size(max = 100)
        String name,
        @Size(max = 100)
        String slug,
        Long parentId,
        Boolean isActive
) {
}
