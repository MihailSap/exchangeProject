package ru.urfu.exchangeProject.dto.user;

import java.util.List;

public record UserListResponse(
        List<UserResponse> data,
        Meta meta
) {
    public record Meta(
            int page,
            int perPage,
            long total
    ) {
    }
}
