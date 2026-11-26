package ru.urfu.exchangeProject.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.urfu.exchangeProject.dto.exceptions.ErrorCode;
import ru.urfu.exchangeProject.dto.review.ReviewCreateRequest;
import ru.urfu.exchangeProject.dto.review.ReviewStatistics;
import ru.urfu.exchangeProject.dto.review.ReviewUpdateRequest;
import ru.urfu.exchangeProject.exception.customEx.NotFoundException;
import ru.urfu.exchangeProject.model.offer.Offer;
import ru.urfu.exchangeProject.model.review.Review;
import ru.urfu.exchangeProject.model.user.User;
import ru.urfu.exchangeProject.repository.ReviewRepository;
import ru.urfu.exchangeProject.service.ReviewService;

import java.time.Duration;
import java.time.Instant;

@Service
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;

    @Autowired
    public ReviewServiceImpl(ReviewRepository reviewRepository) {
        this.reviewRepository = reviewRepository;
    }

    @Transactional(readOnly = true)
    @Override
    public Review getById(Long id) {
        return reviewRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(ErrorCode.REVIEW_NOT_FOUND));
    }

    @Transactional(readOnly = true)
    @Override
    public Page<Review> getUserReviews(Long recipientId, Pageable pageable) {
        return reviewRepository.findAllByRecipient_Id(recipientId, pageable);
    }

    @Transactional(readOnly = true)
    @Override
    public boolean getByAuthorIdAndOfferId(Long authorId, Long offerId){
        return reviewRepository.existsByAuthor_IdAndOffer_Id(authorId, offerId);
    }

    @Override
    public User getReviewRecipient(User authenticatedUser, Offer offer){
        User initiator = offer.getInitiator();
        User recipient = offer.getRecipient();
        if(authenticatedUser.equals(initiator)){
            return recipient;
        } else if (authenticatedUser.equals(recipient)){
            return initiator;
        }
        return null;
    }

    @Transactional(readOnly = true)
    @Override
    public ReviewStatistics getReviewStatistics(Long recipientId){
        return reviewRepository.getStatisticsByRecipientId(recipientId);
    }

    @Transactional
    @Override
    public Review create(
            ReviewCreateRequest reviewCreateRequest, Offer offer, User authenticatedUser, User reviewRecipient) {
        Review review = new Review();
        review.setAuthor(authenticatedUser);
        review.setRecipient(reviewRecipient);
        review.setOffer(offer);
        review.setRating(reviewCreateRequest.rating());
        review.setLot(offer.getTargetLot());

        String text = reviewCreateRequest.text();
        review.setText(text != null && !text.isBlank() ? text.trim() : null);

        Instant now = Instant.now();
        review.setCreatedAt(now);
        review.setUpdatedAt(now);
        review.setLockedAt(now.plus(Duration.ofHours(24)));

        return reviewRepository.save(review);
    }

    @Transactional
    @Override
    public Review update(Review review, ReviewUpdateRequest reviewUpdateRequest) {
        review.setRating(reviewUpdateRequest.rating());
        review.setText(reviewUpdateRequest.text());
        review.setUpdatedAt(Instant.now());
        return reviewRepository.save(review);
    }

    @Transactional
    @Override
    public void delete(Review review) {
        reviewRepository.delete(review);
    }
}
