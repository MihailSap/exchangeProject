package ru.urfu.exchangeProject.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.exchangeProject.model.offer.OfferItem;

@Repository
public interface OfferItemsRepository extends JpaRepository<OfferItem, Long> {
}
