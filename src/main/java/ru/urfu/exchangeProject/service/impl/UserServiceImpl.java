package ru.urfu.exchangeProject.service.impl;

import java.security.SecureRandom;
import java.util.Base64;
import java.time.LocalDateTime;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import ru.urfu.exchangeProject.dto.auth.RegisterRequest;
import ru.urfu.exchangeProject.dto.user.UserUpdateRequest;
import ru.urfu.exchangeProject.exception.customEx.UserNotFoundException;
import ru.urfu.exchangeProject.exception.customEx.news.EmailExistsException;
import ru.urfu.exchangeProject.exception.customEx.news.NameExistsException;
import ru.urfu.exchangeProject.exception.customEx.news.TokenExpiredException;
import ru.urfu.exchangeProject.exception.customEx.news.TokenInvalidException;
import ru.urfu.exchangeProject.model.Role;
import ru.urfu.exchangeProject.model.User;
import ru.urfu.exchangeProject.model.UserStatus;
import ru.urfu.exchangeProject.repository.UserRepository;
import ru.urfu.exchangeProject.service.FileService;
import ru.urfu.exchangeProject.service.UserService;
import ru.urfu.exchangeProject.specification.UserSpecification;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class UserServiceImpl implements UserService {

    private final FileService fileService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserSpecification userSpecification;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int TOKEN_BYTES = 32;

    //FIXME: Задавать через переменную
    private static final long TOKEN_EXPIRATION_HOURS = 1;

    @Autowired
    public UserServiceImpl(
            FileService fileService,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            UserSpecification userSpecification
    ) {
        this.fileService = fileService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.userSpecification = userSpecification;
    }

    @Override
    public Page<User> getAll(int page, int size, String filter) {
        Sort sort = Sort.by(
                Sort.Order.by("role").with(Sort.Direction.DESC),
                Sort.Order.by("id").with(Sort.Direction.ASC));

        Pageable pageable = PageRequest.of(page, size, sort);
        Specification<User> spec = userSpecification.loginOrEmailContains(filter);
        return userRepository.findAll(spec, pageable);
    }

    @Override
    public User getByEmail(String email) throws UserNotFoundException {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("Ошибка поиска пользователя"));
    }

    @Override
    public User getById(long id) throws UserNotFoundException {
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("Ошибка поиска пользователя"));
    }

    @Override
    public User freezeUser(User user, String frozenReason) {
        user.setStatus(UserStatus.FROZEN);
        user.setFrozenAt(Instant.now());
        user.setFrozenReason(frozenReason);
        return userRepository.save(user);
    }

    @Override
    public User unfreezeUser(User user) {
        user.setStatus(UserStatus.ACTIVE);
        user.setFrozenAt(null);
        user.setFrozenReason(null);
        return userRepository.save(user);
    }

    @Transactional
    @Override
    public User create(RegisterRequest registerRequest) {
        User user = new User();
        user.setEmail(registerRequest.email());
        user.setName(registerRequest.name());
        user.setPassword(passwordEncoder.encode(registerRequest.password()));
        user.setEmailConfirmed(false);
        user.setRole(Role.USER);
        user.setStatus(UserStatus.ACTIVE);
        user.setCreatedAt(Instant.now());
        user.setUpdatedAt(Instant.now());

        return userRepository.save(user);
    }

    @Transactional
    @Override
    public User update(UserUpdateRequest userUpdateRequest, User user) {
        String newName = userUpdateRequest.name();
        if(newName != null && !newName.isBlank()){
            if(isExistsByName(newName)){
                throw new NameExistsException();
            }
            user.setName(newName);
        }

        String newEmail = userUpdateRequest.email();
        if(newEmail != null && !newEmail.isBlank()){
            if(isExistsByEmail(newEmail)){
                throw new EmailExistsException();
            }
            user.setEmail(newName);
        }

        String contacts = userUpdateRequest.contacts();;
        if(contacts != null && !contacts.isBlank()){
            user.setContacts(contacts);
        }

        String region = userUpdateRequest.region();
        if(region != null && !region.isBlank()){
            user.setRegion(region);
        }

        MultipartFile avatar = userUpdateRequest.avatar();
        if(avatar != null){
            fileService.delete(avatar.getOriginalFilename());
            String avatarFileTitle = fileService.save(avatar);
            user.setAvatarUrl(avatarFileTitle);
        }

        user.setUpdatedAt(Instant.now());
        return userRepository.save(user);
    }

    @Transactional
    @Override
    public User makeAdmin(User user) {
        user.setRole(Role.ADMIN);
        return userRepository.save(user);
    }

    @Transactional
    @Override
    public User makeNotAdmin(User user) {
        user.setRole(Role.USER);
        return userRepository.save(user);
    }

    @Transactional
    @Override
    public void delete(User user) {
        userRepository.delete(user);
    }

    @Transactional
    @Override
    public User save(User user){
        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    @Override
    public boolean isExistsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Transactional
    @Override
    public void updatePassword(User user, String newPassword) {
        String newEncodedPassword = passwordEncoder.encode(newPassword);
        user.setPassword(newEncodedPassword);
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    private boolean isExistsByName(String name) {
        return userRepository.existsByName(name);
    }

//    @Transactional
//    @Override
//    public String setPasswordResetToken(User user) {
//        //FIXME: токен должен быть истекающим и корректным
//        String token = UUID.randomUUID().toString();
//        user.setPasswordResetToken(token);
//        user.setPasswordResetTokenExpiresAt(LocalDateTime.now().plusHours(1));
//        userRepository.save(user);
//        return token;
//    }

    @Transactional
    @Override
    public String setPasswordResetToken(User user) {
        byte[] randomBytes = new byte[TOKEN_BYTES];
        SECURE_RANDOM.nextBytes(randomBytes);

        String token = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(randomBytes);

        user.setPasswordResetToken(token);
        user.setPasswordResetTokenExpiresAt(
                LocalDateTime.now().plusHours(TOKEN_EXPIRATION_HOURS)
        );

        userRepository.save(user);
        return token;
    }

    @Transactional(readOnly = true)
    @Override
    public User getByPasswordResetToken(String token) {
        User user = userRepository.findByPasswordResetToken(token)
                .orElseThrow(TokenInvalidException::new);
        if (user.getPasswordResetTokenExpiresAt() == null
                || user.getPasswordResetTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new TokenExpiredException();
        }
        return user;
    }

    @Transactional
    @Override
    public void setNullPasswordResetToken(User user){
        user.setPasswordResetToken(null);
        user.setPasswordResetTokenExpiresAt(null);
        userRepository.save(user);
    }
}
