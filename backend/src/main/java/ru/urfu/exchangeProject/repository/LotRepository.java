package ru.urfu.exchangeProject.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ru.urfu.exchangeProject.model.lot.DeliveryMethod;
import ru.urfu.exchangeProject.model.lot.Lot;
import ru.urfu.exchangeProject.model.lot.LotStatus;
import ru.urfu.exchangeProject.model.lot.LotType;
import ru.urfu.exchangeProject.model.user.UserStatus;

import java.math.BigDecimal;

@Repository
public interface LotRepository extends JpaRepository<Lot, Long> {

    @Query(
            value = """
                    SELECT l
                    FROM Lot l
                    JOIN l.user u
                    WHERE l.status = :activeStatus
                      AND u.status <> :frozenStatus

                      AND (
                          :q = ''
                          OR LOWER(COALESCE(l.title, ''))
                             LIKE CONCAT('%', LOWER(:q), '%')
                          OR LOWER(COALESCE(l.description, ''))
                             LIKE CONCAT('%', LOWER(:q), '%')
                      )

                      AND (
                          :categoryId IS NULL
                          OR l.category.id = :categoryId
                      )

                      AND (
                          :region = ''
                          OR LOWER(l.region) = LOWER(:region)
                      )

                      AND (
                          :type IS NULL
                          OR l.type = :type
                      )

                      AND (
                          :deliveryMethod IS NULL
                          OR l.deliveryMethod = :deliveryMethod
                      )

                      AND (
                          :minCost IS NULL
                          OR l.estimatedCost >= :minCost
                      )

                      AND (
                          :maxCost IS NULL
                          OR l.estimatedCost <= :maxCost
                      )
                    """,

            countQuery = """
                    SELECT COUNT(l)
                    FROM Lot l
                    JOIN l.user u
                    WHERE l.status = :activeStatus
                      AND u.status <> :frozenStatus

                      AND (
                          :q = ''
                          OR LOWER(COALESCE(l.title, ''))
                             LIKE CONCAT('%', LOWER(:q), '%')
                          OR LOWER(COALESCE(l.description, ''))
                             LIKE CONCAT('%', LOWER(:q), '%')
                      )

                      AND (
                          :categoryId IS NULL
                          OR l.category.id = :categoryId
                      )

                      AND (
                          :region = ''
                          OR LOWER(l.region) = LOWER(:region)
                      )

                      AND (
                          :type IS NULL
                          OR l.type = :type
                      )

                      AND (
                          :deliveryMethod IS NULL
                          OR l.deliveryMethod = :deliveryMethod
                      )

                      AND (
                          :minCost IS NULL
                          OR l.estimatedCost >= :minCost
                      )

                      AND (
                          :maxCost IS NULL
                          OR l.estimatedCost <= :maxCost
                      )
                    """
    )
    Page<Lot> searchLots(
            @Param("activeStatus") LotStatus activeStatus,
            @Param("frozenStatus") UserStatus frozenStatus,
            @Param("q") String q,
            @Param("categoryId") Long categoryId,
            @Param("region") String region,
            @Param("type") LotType type,
            @Param("deliveryMethod") DeliveryMethod deliveryMethod,
            @Param("minCost") BigDecimal minCost,
            @Param("maxCost") BigDecimal maxCost,
            Pageable pageable
    );
}