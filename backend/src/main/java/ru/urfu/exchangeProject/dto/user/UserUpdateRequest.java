package ru.urfu.exchangeProject.dto.user;

import org.springframework.web.multipart.MultipartFile;
import ru.urfu.exchangeProject.validation.Region;

public record UserUpdateRequest(
        String email,
        String name,
        String contacts,
        @Region
        String region,
        MultipartFile avatar
) {
}
