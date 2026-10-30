package ru.urfu.exchangeProject.dto.user;

import org.springframework.web.multipart.MultipartFile;

public record UserUpdateRequest(String email, String name, String contacts, String region, MultipartFile avatar) {
}
