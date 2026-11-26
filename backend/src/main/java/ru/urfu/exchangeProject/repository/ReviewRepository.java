package ru.urfu.exchangeProject.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ru.urfu.exchangeProject.dto.review.ReviewStatistics;
import ru.urfu.exchangeProject.model.review.Review;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    boolean existsByAuthor_IdAndOffer_Id(Long authorId, Long offerId);

    @Query("""
            SELECT new ru.urfu.exchangeProject.dto.review.ReviewStatistics(
                AVG(r.rating),
                COUNT(r.id)
            )
            FROM Review r
            WHERE r.recipient.id = :recipientId
            """)
    ReviewStatistics getStatisticsByRecipientId(
            @Param("recipientId") Long recipientId
    );

    Page<Review> findAllByRecipient_Id(Long recipientId, Pageable pageable);
}
