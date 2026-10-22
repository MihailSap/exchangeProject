package ru.urfu.exchangeProject.service;

import org.springframework.data.domain.Page;
import ru.urfu.exchangeProject.dto.auth.RegisterRequest;
import ru.urfu.exchangeProject.dto.user.UserUpdateRequest;
import ru.urfu.exchangeProject.exception.customEx.UserNotFoundException;
import ru.urfu.exchangeProject.model.user.User;

public interface UserService {

    User create(RegisterRequest registerRequest);

    User save(User user);

    String setPasswordResetToken(User user);

    Page<User> getAll(int page, int size, String filter);

    User getById(long id) throws UserNotFoundException;

    User freezeUser(User user, String frozenReason);

    User unfreezeUser(User user);

    User getByEmail(String email) throws UserNotFoundException;

    void changeRole(User user);

    User getByPasswordResetToken(String token);

    User update(UserUpdateRequest userUpdateRequest, User user);

    void updatePassword(User user, String newPassword);

    void setNullPasswordResetToken(User user);

    User makeAdmin(User user);

    User makeNotAdmin(User user);

    void delete(User user);

    boolean isExistsByEmail(String email);
}
