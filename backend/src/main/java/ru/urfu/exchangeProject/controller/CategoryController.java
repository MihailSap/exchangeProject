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
import ru.urfu.exchangeProject.model.category.Category;
import ru.urfu.exchangeProject.service.CategoryService;

import java.util.List;

@Tag(name = "Категории")
@SecurityRequirement(name = "bearerAuth")
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
        List<Category> categories = categoryService.findParents();
        List<Category> parentsCategories = categoryService.filterParentsCategory(categories);
        List<CategoryResponse> categoryResponses = categoryMapper.mapToCategoryResponses(parentsCategories, null);
        return new BaseResponse<>(categoryResponses);
    }

    @Operation(description = "Получение всех активных категорий")
    @GetMapping("/active")
    public BaseResponse<List<CategoryResponse>> findActive() {
        List<Category> categories = categoryService.findParentsByActive(true);
        List<CategoryResponse> responses =
                categoryMapper.mapToCategoryResponses(categories, true);

        return new BaseResponse<>(responses);
    }

    @Operation(description = "Получение всех активных категорий")
    @GetMapping("/inactive")
    public BaseResponse<List<CategoryResponse>> findInactive() {
        List<Category> categories = categoryService.findParentsByActive(false);
        List<CategoryResponse> responses =
                categoryMapper.mapToCategoryResponses(categories, false);

        return new BaseResponse<>(responses);
    }

    @Operation(description = "Получение категории")
    @GetMapping("/{id}")
    public BaseResponse<CategoryResponse> findById(@PathVariable("id") Long id) throws CategoryNotFound {
        Category category = categoryService.findById(id);
        CategoryResponse categoryResponse = categoryMapper.mapToCategoryResponse(category, null);
        return new BaseResponse<>(categoryResponse);
    }

    @Operation(description = "Создание категории")
    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BaseResponse<CategoryResponse> create(@Valid @RequestBody CategoryRequest request) throws CategoryNotFound {
        Category category = categoryService.create(request);
        CategoryResponse categoryResponse = categoryMapper.mapToCategoryResponse(category, null);
        return new BaseResponse<>(categoryResponse);
    }

    @Operation(description = "Обновление категории")
    @PreAuthorize("hasAuthority('ADMIN')")
    @PutMapping("/{id}")
    public BaseResponse<CategoryResponse> update(@PathVariable("id") Long id, @RequestBody CategoryRequest request) throws CategoryNotFound {
        Category category = categoryService.findById(id);
        Category updatedCategory = categoryService.update(category, request);
        CategoryResponse categoryResponse = categoryMapper.mapToCategoryResponse(updatedCategory, null);
        return new BaseResponse<>(categoryResponse);
    }

    @Operation(description = "Удаление категории")
    @PreAuthorize("hasAuthority('ADMIN')")
    @DeleteMapping("/{id}")
    public BaseResponse<CategoryResponse> delete(@PathVariable("id") Long id) throws CategoryNotFound {
        Category category = categoryService.findById(id);
        Category inactiveCategory = categoryService.softDelete(category);
        CategoryResponse categoryResponse = categoryMapper.mapToCategoryResponse(inactiveCategory, null);
        return new BaseResponse<>(categoryResponse);
    }
}
