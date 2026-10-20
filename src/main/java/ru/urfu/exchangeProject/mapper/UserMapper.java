package ru.urfu.exchangeProject.mapper;

import org.springframework.stereotype.Component;
import ru.urfu.exchangeProject.dto.auth.UserLoginResponse;
import ru.urfu.exchangeProject.dto.user.UserProfileResponse;
import ru.urfu.exchangeProject.dto.user.UserPublicProfileResponse;
import ru.urfu.exchangeProject.dto.user.UserResponse;
import ru.urfu.exchangeProject.model.User;

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

    public UserProfileResponse mapToUserProfileResponse(User user){
        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getAvatarUrl(),
                user.getRegion(),
                user.getContacts(),
                user.isEmailConfirmed(),
                user.getStatus(),
                null, //TODO
                0, //TODO
                user.getCreatedAt()
        );
    }

    public UserPublicProfileResponse mapToUserPublicProfileResponse(User user){
        return new UserPublicProfileResponse(
                user.getId(),
                user.getName(),
                user.getAvatarUrl(),
                user.getRegion(),
                user.getContacts(),
                user.isEmailConfirmed(),
                null, //TODO
                0, //TODO
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
}
