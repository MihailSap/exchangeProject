package ru.urfu.exchangeProject.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.urfu.exchangeProject.exception.customEx.RefreshTokenNotFoundException;
import ru.urfu.exchangeProject.model.jwt.RefreshToken;
import ru.urfu.exchangeProject.model.user.User;
import ru.urfu.exchangeProject.repository.RefreshTokenRepository;
import ru.urfu.exchangeProject.service.RefreshTokenService;

@Service
public class RefreshTokenServiceImpl implements RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Autowired
    public RefreshTokenServiceImpl(RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }

    @Override
    public RefreshToken getByBody(String body) throws RefreshTokenNotFoundException {
        return refreshTokenRepository.findByBody(body)
                .orElseThrow(() -> new RefreshTokenNotFoundException(
                        "Запрашиваемый токен некорректен"));
    }

    @Override
    public RefreshToken getByUser(User user) throws RefreshTokenNotFoundException {
        return refreshTokenRepository.findByUser(user)
                .orElseThrow(() -> new RefreshTokenNotFoundException(
                        "Ошибка при попытке получения токена пользователя"));
    }

    @Transactional
    @Override
    public RefreshToken save(RefreshToken refreshToken){
        return refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    @Override
    public void delete(RefreshToken refreshToken){
        refreshTokenRepository.delete(refreshToken);
    }
}
