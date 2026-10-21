package ru.urfu.exchangeProject.service;

import ru.urfu.exchangeProject.dto.category.CategoryRequest;
import ru.urfu.exchangeProject.exception.customEx.news.CategoryNotFound;
import ru.urfu.exchangeProject.model.Category;

import java.util.List;

public interface CategoryService {

    List<Category> findAll();

    Category findById(Long id) throws CategoryNotFound;

    Category create(CategoryRequest request) throws CategoryNotFound;

    Category update(Category category, CategoryRequest request) throws CategoryNotFound;

    void delete(Category category);
}
