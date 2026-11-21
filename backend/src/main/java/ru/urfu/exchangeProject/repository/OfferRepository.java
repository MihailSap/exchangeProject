package ru.urfu.exchangeProject.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ru.urfu.exchangeProject.model.offer.Offer;

@Repository
public interface OfferRepository extends JpaRepository<Offer, Long> {
}