package ru.urfu.exchangeProject.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.exchangeProject.model.lot.Lot;

@Repository
public interface LotRepository extends JpaRepository<Lot, Long> {
}
