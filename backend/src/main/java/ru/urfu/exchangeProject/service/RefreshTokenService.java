package ru.urfu.exchangeProject.service;

import ru.urfu.exchangeProject.exception.customEx.RefreshTokenNotFoundException;
import ru.urfu.exchangeProject.model.jwt.RefreshToken;
import ru.urfu.exchangeProject.model.user.User;

public interface RefreshTokenService {

    RefreshToken getByBody(String body) throws RefreshTokenNotFoundException;

    RefreshToken getByUser(User user) throws RefreshTokenNotFoundException;

    RefreshToken save(RefreshToken refreshToken);

    void delete(RefreshToken refreshToken);
}
