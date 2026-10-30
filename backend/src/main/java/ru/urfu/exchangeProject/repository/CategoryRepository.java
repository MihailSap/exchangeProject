package ru.urfu.exchangeProject.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.urfu.exchangeProject.model.category.Category;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);

    boolean existsByParent_Id(Long parentId);

    List<Category> findByActive(boolean active);

    List<Category> findByActiveAndParentIsNull(boolean active);

    List<Category> findByParentIsNull();
}
