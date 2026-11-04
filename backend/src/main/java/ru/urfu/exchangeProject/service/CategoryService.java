package ru.urfu.exchangeProject.service;

import ru.urfu.exchangeProject.dto.category.CategoryCreateRequest;
import ru.urfu.exchangeProject.dto.category.CategoryUpdateRequest;
import ru.urfu.exchangeProject.exception.customEx.news.CategoryNotFound;
import ru.urfu.exchangeProject.model.category.Category;

import java.util.List;

public interface CategoryService {

    List<Category> findParents();

    List<Category> findParentsByActive(boolean active);

    Category findById(Long id) throws CategoryNotFound;

    List<Category> filterParentsCategory(List<Category> categories);

    Category create(CategoryCreateRequest request) throws CategoryNotFound;

    Category update(Category category, CategoryUpdateRequest request) throws CategoryNotFound;

    Category softDelete(Category category);
}
