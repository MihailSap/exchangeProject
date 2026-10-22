package ru.urfu.exchangeProject.mapper;

import org.springframework.stereotype.Component;
import ru.urfu.exchangeProject.dto.category.CategoryResponse;
import ru.urfu.exchangeProject.dto.category.CategoryTargetResponse;
import ru.urfu.exchangeProject.model.category.Category;

import java.util.ArrayList;
import java.util.List;

@Component
public class CategoryMapper {

    public List<CategoryResponse> mapToCategoryResponses(List<Category> categories){
        List<CategoryResponse> categoryResponses = new ArrayList<>();
        for(Category category : categories){
            categoryResponses.add(mapToCategoryResponse(category));
        }
        return categoryResponses;
    }

    public CategoryResponse mapToCategoryResponse(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getSlug(),
                mapToCategoryResponses(category.getChildren())
        );
    }

    public CategoryTargetResponse mapToCategoryShortResponse(Category category) {
        return new CategoryTargetResponse(
                category.getId(),
                category.getName()
        );
    }
}