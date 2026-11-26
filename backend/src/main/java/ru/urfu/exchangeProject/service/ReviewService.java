package ru.urfu.exchangeProject.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import ru.urfu.exchangeProject.dto.review.ReviewCreateRequest;
import ru.urfu.exchangeProject.dto.review.ReviewStatistics;
import ru.urfu.exchangeProject.dto.review.ReviewUpdateRequest;
import ru.urfu.exchangeProject.model.offer.Offer;
import ru.urfu.exchangeProject.model.review.Review;
import ru.urfu.exchangeProject.model.user.User;

public interface ReviewService {

    Review getById(Long id);

    Page<Review> getUserReviews(Long recipientId, Pageable pageable);

    boolean getByAuthorIdAndOfferId(Long authorId, Long offerId);

    User getReviewRecipient(User authenticatedUser, Offer offer);

    ReviewStatistics getReviewStatistics(Long recipientId);

    Review create(ReviewCreateRequest reviewCreateRequest, Offer offer, User authenticatedUser, User reviewRecipient);

    Review update(Review review, ReviewUpdateRequest reviewUpdateRequest);

    void delete(Review review);
}
