package ru.urfu.exchangeProject.mapper;

import org.springframework.stereotype.Component;
import ru.urfu.exchangeProject.dto.auth.UserLoginResponse;
import ru.urfu.exchangeProject.dto.review.ReviewStatistics;
import ru.urfu.exchangeProject.dto.user.*;
import ru.urfu.exchangeProject.model.user.User;

import java.util.List;

@Component
public class UserMapper {

    public UserResponse mapToUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getAvatarUrl(),
                user.getContacts(),
                user.isEmailConfirmed(),
                user.getStatus(),
                user.getCreatedAt(),
                user.getRole()
        );
    }

    public UserRegisterResponse mapToUserRegisterResponse(User user){
        return new UserRegisterResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.isEmailConfirmed(),
                user.getCreatedAt()
        );
    }

    public UserProfileResponse mapToUserProfileResponse(User user, ReviewStatistics reviewStatistics){
        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getAvatarUrl(),
                user.getRegion(),
                user.getContacts(),
                user.isEmailConfirmed(),
                user.getStatus(),
                reviewStatistics,
                user.getCreatedAt(),
                user.getRole()
        );
    }

    public UserPublicProfileResponse mapToUserPublicProfileResponse(User user, ReviewStatistics reviewStatistics){
        return new UserPublicProfileResponse(
                user.getId(),
                user.getName(),
                user.getAvatarUrl(),
                user.getRegion(),
                user.getContacts(),
                user.isEmailConfirmed(),
                reviewStatistics,
                user.getCreatedAt(),
                List.of(),
                List.of()
        );
    }

    public UserLoginResponse mapToUserLoginResponse(User user){
        return new UserLoginResponse(
                user.getId(),
                user.getName(),
                user.getStatus()
        );
    }

    public UserShortResponse mapToUserShortResponse(User user, ReviewStatistics reviewStatistics) {
        return new UserShortResponse(
                user.getId(),
                user.getName(),
                reviewStatistics
        );
    }
}
