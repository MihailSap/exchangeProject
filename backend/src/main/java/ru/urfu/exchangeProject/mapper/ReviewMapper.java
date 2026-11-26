package ru.urfu.exchangeProject.mapper;

import org.springframework.stereotype.Component;
import ru.urfu.exchangeProject.dto.review.ReviewResponse;
import ru.urfu.exchangeProject.model.review.Review;

@Component
public class ReviewMapper {

    public ReviewResponse mapToReviewResponse(Review review){
        return new ReviewResponse(
                review.getId(),
                review.getAuthor().getId(),
                review.getRecipient().getId(),
                review.getLot().getId(),
                review.getOffer().getId(),
                review.getRating(),
                review.getText(),
                review.getCreatedAt(),
                review.getUpdatedAt(),
                review.getLockedAt()
        );
    }
}
