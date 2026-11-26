package ru.urfu.exchangeProject.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import ru.urfu.exchangeProject.PathsConstants;
import ru.urfu.exchangeProject.dto.BaseResponse;
import ru.urfu.exchangeProject.dto.exceptions.ErrorCode;
import ru.urfu.exchangeProject.dto.review.ReviewCreateRequest;
import ru.urfu.exchangeProject.dto.review.ReviewResponse;
import ru.urfu.exchangeProject.dto.review.ReviewUpdateRequest;
import ru.urfu.exchangeProject.exception.globalEx.ConflictException;
import ru.urfu.exchangeProject.exception.globalEx.ForbiddenException;
import ru.urfu.exchangeProject.mapper.ReviewMapper;
import ru.urfu.exchangeProject.model.offer.Offer;
import ru.urfu.exchangeProject.model.offer.OfferStatus;
import ru.urfu.exchangeProject.model.review.Review;
import ru.urfu.exchangeProject.model.user.User;
import ru.urfu.exchangeProject.service.AuthService;
import ru.urfu.exchangeProject.service.OfferService;
import ru.urfu.exchangeProject.service.ReviewService;

import java.time.Instant;

@Tag(name = "Отзывы")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.REVIEWS)
public class ReviewsController {

    private final AuthService authService;
    private final OfferService offerService;
    private final ReviewService reviewService;
    private final ReviewMapper reviewMapper;

    @Autowired
    public ReviewsController(
            AuthService authService,
            OfferService offerService,
            ReviewService reviewService,
            ReviewMapper reviewMapper
    ) {
        this.authService = authService;
        this.offerService = offerService;
        this.reviewService = reviewService;
        this.reviewMapper = reviewMapper;
    }

    @Operation(description = "Создание отзыва")
    @PostMapping
    public BaseResponse<ReviewResponse> create(@RequestBody @Valid ReviewCreateRequest reviewCreateRequest){
        User authenticatedUser = authService.getAuthenticatedUser();
        Offer offer = offerService.getById(reviewCreateRequest.offerId());
        if (offer.getStatus() != OfferStatus.COMPLETED) {
            throw new ConflictException(ErrorCode.INVALID_STATUS_TRANSITION);
        }
        if(reviewService.getByAuthorIdAndOfferId(authenticatedUser.getId(), offer.getId())){
            throw new ConflictException(ErrorCode.INVALID_STATUS_TRANSITION);
        }

        User reviewRecipient = reviewService.getReviewRecipient(authenticatedUser, offer);
        if(reviewRecipient == null) {
            throw new ForbiddenException(ErrorCode.NOT_OFFER_PARTICIPANT);
        }

        Review review = reviewService.create(reviewCreateRequest, offer, authenticatedUser, reviewRecipient);
        ReviewResponse reviewResponse = reviewMapper.mapToReviewResponse(review);
        return new BaseResponse<>(reviewResponse);
    }

    @Operation(description = "Редактирование отзыва")
    @PatchMapping("/{id}")
    public BaseResponse<ReviewResponse> update(
            @PathVariable("id") Long id, @RequestBody @Valid ReviewUpdateRequest reviewUpdateRequest){
        User authenticatedUser = authService.getAuthenticatedUser();
        Review review = reviewService.getById(id);
        validateAccess(authenticatedUser, review);

        Review updatedReview = reviewService.update(review, reviewUpdateRequest);
        ReviewResponse reviewResponse = reviewMapper.mapToReviewResponse(updatedReview);
        return new BaseResponse<>(reviewResponse);
    }

    @Operation(description = "Получение отзыва")
    @GetMapping("/{id}")
    public BaseResponse<ReviewResponse> getById(@PathVariable("id") Long id){
        Review review = reviewService.getById(id);
        ReviewResponse reviewResponse = reviewMapper.mapToReviewResponse(review);
        return new BaseResponse<>(reviewResponse);
    }

    @Operation(description = "Удаление отзыва")
    @DeleteMapping("/{id}")
    public BaseResponse<ReviewResponse> delete(@PathVariable("id") Long id){
        User authenticatedUser = authService.getAuthenticatedUser();
        Review review = reviewService.getById(id);
        validateAccess(authenticatedUser, review);

        reviewService.delete(review);
        ReviewResponse reviewResponse = reviewMapper.mapToReviewResponse(review);
        return new BaseResponse<>(reviewResponse);
    }

    private void validateAccess(User authenticatedUser, Review review){
        if(!authenticatedUser.equals(review.getAuthor())){
            throw new ForbiddenException(ErrorCode.ACCESS_DENIED);
        }
        if(review.getLockedAt().isBefore(Instant.now())){
            throw new ConflictException(ErrorCode.REVIEW_LOCKED);
        }
    }
}
