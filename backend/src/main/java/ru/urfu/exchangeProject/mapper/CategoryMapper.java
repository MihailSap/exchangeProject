package ru.urfu.exchangeProject.mapper;

import org.springframework.stereotype.Component;
import ru.urfu.exchangeProject.dto.category.CategoryResponse;
import ru.urfu.exchangeProject.dto.category.CategoryTargetResponse;
import ru.urfu.exchangeProject.model.category.Category;

import java.util.List;

@Component
public class CategoryMapper {

    public List<CategoryResponse> mapToCategoryResponses(
            List<Category> categories,
            Boolean active
    ) {
        return categories.stream()
                .filter(category -> active == null || category.isActive() == active)
                .filter(category -> active == null || hasNoMatchingParent(category, active))
                .map(category -> mapToCategoryResponse(category, active))
                .toList();
    }

    public CategoryResponse mapToCategoryResponse(Category category, Boolean active) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getSlug(),
                category.isActive(),
                mapChildren(category, active)
        );
    }

    private List<CategoryResponse> mapChildren(Category category, Boolean active) {
        return category.getChildren().stream()
                .filter(child -> active == null || child.isActive() == active)
                .map(child -> mapToCategoryResponse(child, active))
                .toList();
    }

    private boolean hasNoMatchingParent(Category category, boolean active) {
        Category parent = category.getParent();

        while (parent != null) {
            if (parent.isActive() == active) {
                return false;
            }
            parent = parent.getParent();
        }

        return true;
    }

    public CategoryTargetResponse mapToCategoryShortResponse(Category category) {
        return new CategoryTargetResponse(
                category.getId(),
                category.getName()
        );
    }
}