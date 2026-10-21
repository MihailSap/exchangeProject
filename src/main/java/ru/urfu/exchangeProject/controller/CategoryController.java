package ru.urfu.exchangeProject.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ru.urfu.exchangeProject.PathsConstants;
import ru.urfu.exchangeProject.dto.BaseResponse;
import ru.urfu.exchangeProject.dto.category.CategoryRequest;
import ru.urfu.exchangeProject.dto.category.CategoryResponse;
import ru.urfu.exchangeProject.exception.customEx.news.CategoryNotFound;
import ru.urfu.exchangeProject.mapper.CategoryMapper;
import ru.urfu.exchangeProject.model.Category;
import ru.urfu.exchangeProject.service.CategoryService;

import java.util.List;

@Tag(name = "Категории")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAuthority('ADMIN')")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.CATEGORIES)
public class CategoryController {

    private final CategoryService categoryService;
    private final CategoryMapper categoryMapper;

    @Autowired
    public CategoryController(
            CategoryService categoryService,
            CategoryMapper categoryMapper
    ) {
        this.categoryService = categoryService;
        this.categoryMapper = categoryMapper;
    }

    @Operation(description = "Получение всех категорий")
    @GetMapping
    public BaseResponse<List<CategoryResponse>> findAll() {
        List<Category> categories = categoryService.findAll();
        List<CategoryResponse> categoryResponses = categoryMapper.mapToCategoryResponses(categories);
        return new BaseResponse<>(categoryResponses);
    }

    @Operation(description = "Получение категории")
    @GetMapping("/{id}")
    public BaseResponse<CategoryResponse> findById(@PathVariable("id") Long id) throws CategoryNotFound {
        Category category = categoryService.findById(id);
        CategoryResponse categoryResponse = categoryMapper.mapToCategoryResponse(category);
        return new BaseResponse<>(categoryResponse);
    }

    @Operation(description = "Создание категории")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BaseResponse<CategoryResponse> create(@Valid @RequestBody CategoryRequest request) throws CategoryNotFound {
        Category category = categoryService.create(request);
        CategoryResponse categoryResponse = categoryMapper.mapToCategoryResponse(category);
        return new BaseResponse<>(categoryResponse);
    }

    @Operation(description = "Обновление категории")
    @PutMapping("/{id}")
    public BaseResponse<CategoryResponse> update(@PathVariable("id") Long id, @Valid @RequestBody CategoryRequest request) throws CategoryNotFound {
        Category category = categoryService.findById(id);
        Category updatedCategory = categoryService.update(category, request);
        CategoryResponse categoryResponse = categoryMapper.mapToCategoryResponse(updatedCategory);
        return new BaseResponse<>(categoryResponse);
    }

    @Operation(description = "Удаление категории")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable("id") Long id) throws CategoryNotFound {
        Category category = categoryService.findById(id);
        categoryService.delete(category);
    }
}
