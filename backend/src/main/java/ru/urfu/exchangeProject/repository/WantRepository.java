package ru.urfu.exchangeProject.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.exchangeProject.model.jwt.RefreshToken;
import ru.urfu.exchangeProject.model.lot.want.Want;

@Repository
public interface WantRepository extends JpaRepository<Want, Long>{
}
