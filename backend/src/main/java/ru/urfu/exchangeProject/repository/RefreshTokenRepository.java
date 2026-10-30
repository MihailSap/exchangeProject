package ru.urfu.exchangeProject.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.exchangeProject.model.jwt.RefreshToken;
import ru.urfu.exchangeProject.model.user.User;

import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByBody(String body);

    Optional<RefreshToken> findByUser(User user);
}
