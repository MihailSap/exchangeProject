package ru.urfu.exchangeProject.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import ru.urfu.exchangeProject.PathsConstants;
import ru.urfu.exchangeProject.dto.BaseResponse;
import ru.urfu.exchangeProject.dto.review.ReviewResponse;
import ru.urfu.exchangeProject.dto.review.ReviewStatistics;
import ru.urfu.exchangeProject.dto.user.*;
import ru.urfu.exchangeProject.exception.customEx.UserNotFoundException;
import ru.urfu.exchangeProject.exception.customEx.news.BadRequestException;
import ru.urfu.exchangeProject.mapper.ReviewMapper;
import ru.urfu.exchangeProject.mapper.UserMapper;
import ru.urfu.exchangeProject.model.user.User;
import ru.urfu.exchangeProject.service.AuthService;
import ru.urfu.exchangeProject.service.ReviewService;
import ru.urfu.exchangeProject.service.UserService;

import java.util.*;

@Tag(name = "Управление пользователями")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.USERS)
public class UserController {

    private final AuthService authService;
    private final UserService userService;
    private final UserMapper userMapper;
    private final ReviewService reviewService;
    private final ReviewMapper reviewMapper;

    @Autowired
    public UserController(
            AuthService authService,
            UserService userService,
            UserMapper userMapper,
            ReviewService reviewService,
            ReviewMapper reviewMapper
    ) {
        this.authService = authService;
        this.userService = userService;
        this.userMapper = userMapper;
        this.reviewService = reviewService;
        this.reviewMapper = reviewMapper;
    }

    @Operation(description = "Получение отзывов пользователя")
    @GetMapping("/{id}/reviews")
    public BaseResponse<Page<ReviewResponse>> getUserReviews(
            @PathVariable("id") long userId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(name = "per_page", defaultValue = "20") int perPage,
            @RequestParam(required = false) String sort
    ) throws UserNotFoundException {
        if (page < 1 || perPage < 1) {
            throw new BadRequestException();
        }
        userService.getById(userId);
        Sort sorting = parseReviewSort(sort);
        PageRequest pageable = PageRequest.of(
                page - 1, perPage, sorting);
        Page<ReviewResponse> reviews = reviewService
                .getUserReviews(userId, pageable)
                .map(reviewMapper::mapToReviewResponse);

        return new BaseResponse<>(reviews);
    }

    @Operation(description = "Получение профиля текущего пользователя")
    @GetMapping("/me")
    public BaseResponse<UserProfileResponse> getCurrentUser() throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        ReviewStatistics reviewStatistics = reviewService.getReviewStatistics(user.getId());
        UserProfileResponse userProfileResponse = userMapper.mapToUserProfileResponse(user, reviewStatistics);
        return new BaseResponse<>(userProfileResponse);
    }

    @Operation(description = "Обновление профиля текущего пользователя")
    @PatchMapping(value = "/me", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public BaseResponse<UserProfileResponse> updateCurrentUser(@Valid @ModelAttribute UserUpdateRequest userUpdateRequest)
            throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        User updatedUser = userService.update(userUpdateRequest, user);
        ReviewStatistics reviewStatistics = reviewService.getReviewStatistics(updatedUser.getId());
        UserProfileResponse userProfileResponse = userMapper.mapToUserProfileResponse(updatedUser, reviewStatistics);
        return new BaseResponse<>(userProfileResponse);
    }

    @Operation(description = "Удаление аватара текущего пользователя")
    @DeleteMapping("/me/avatar")
    public BaseResponse<UserProfileResponse> deleteAvatar() throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        User updatedUser = userService.deleteAvatar(user);
        ReviewStatistics reviewStatistics = reviewService.getReviewStatistics(updatedUser.getId());
        UserProfileResponse userProfileResponse = userMapper.mapToUserProfileResponse(updatedUser, reviewStatistics);
        return new BaseResponse<>(userProfileResponse);
    }

    @Operation(description = "Получение публичного профиля пользователя")
    @GetMapping("/{userId}")
    public BaseResponse<UserPublicProfileResponse> getUserPublicProfile(@PathVariable("userId") long userId)
            throws UserNotFoundException {
        User user = userService.getById(userId);
        ReviewStatistics reviewStatistics = reviewService.getReviewStatistics(user.getId());
        UserPublicProfileResponse userPublicProfileResponse =
                userMapper.mapToUserPublicProfileResponse(user, reviewStatistics);
        return new BaseResponse<>(userPublicProfileResponse);
    }

    private Sort parseReviewSort(String sort) {
        if (sort == null || sort.isBlank()) {
            return Sort.by(
                    Sort.Order.desc("createdAt"), Sort.Order.desc("id"));
        }

        List<Sort.Order> orders = new ArrayList<>();
        Set<String> fields = new HashSet<>();

        for (String value : sort.split("\\|", -1)) {
            Sort.Order order = switch (value.trim().toLowerCase(Locale.ROOT)) {
                case "date_desc" -> Sort.Order.desc("createdAt");
                case "date_asc" -> Sort.Order.asc("createdAt");
                case "rating_desc" -> Sort.Order.desc("rating");
                case "rating_asc" -> Sort.Order.asc("rating");
                default -> throw new BadRequestException();
            };

            if (!fields.add(order.getProperty())) {
                throw new BadRequestException();
            }

            orders.add(order);
        }

        orders.add(Sort.Order.desc("id"));
        return Sort.by(orders);
    }
}
