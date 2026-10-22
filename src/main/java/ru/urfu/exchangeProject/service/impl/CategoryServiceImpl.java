package ru.urfu.exchangeProject.service.impl;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import ru.urfu.exchangeProject.dto.category.CategoryRequest;
import ru.urfu.exchangeProject.exception.customEx.news.CategoryCircularHierarchyException;
import ru.urfu.exchangeProject.exception.customEx.news.CategoryNotFound;
import ru.urfu.exchangeProject.exception.customEx.news.SlugExistsException;
import ru.urfu.exchangeProject.model.category.Category;
import ru.urfu.exchangeProject.repository.CategoryRepository;
import ru.urfu.exchangeProject.service.CategoryService;

import java.time.Instant;
import java.util.List;

@Service
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Autowired
    public CategoryServiceImpl(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Transactional
    @Override
    public List<Category> findAll() {
        return categoryRepository.findAll();
    }

    @Transactional
    @Override
    public Category findById(Long id) throws CategoryNotFound {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new CategoryNotFound("Категория не найдена"));
    }

    @Transactional
    @Override
    public Category create(CategoryRequest request) throws CategoryNotFound {
        String slug = request.slug().trim();
        if (categoryRepository.existsBySlug(slug)) {
            throw new SlugExistsException();
        }

        Category category = new Category();
        category.setCreatedAt(Instant.now());
        updateCategory(category, request);

        return categoryRepository.save(category);
    }

    @Transactional
    @Override
    public Category update(Category category, CategoryRequest request) throws CategoryNotFound {
        String slug = request.slug().trim();
        if (categoryRepository.existsBySlugAndIdNot(slug, category.getId())) {
            throw new SlugExistsException();
        }

        updateCategory(category, request);
        return categoryRepository.save(category);
    }

    private void updateCategory(Category category, CategoryRequest request) throws CategoryNotFound {
        category.setName(request.name().trim());
        category.setSlug(request.slug().trim());

        if (request.parentId() == null) {
            category.setParent(null);
        } else {
            Category parent = findById(request.parentId());
            validateParent(category, parent);
            category.setParent(parent);
        }

        if (request.isActive() != null) {
            category.setActive(request.isActive());
        } else {
            category.setActive(true);
        }
    }

    private void validateParent(Category category, Category parent) {
        Category ancestor = parent;
        while (ancestor != null) {
            if (ancestor.getId().equals(category.getId())) {
                throw new CategoryCircularHierarchyException();
            }

            ancestor = ancestor.getParent();
        }
    }

    @Transactional
    @Override
    public void delete(Category category) {
        categoryRepository.delete(category);
    }
}
