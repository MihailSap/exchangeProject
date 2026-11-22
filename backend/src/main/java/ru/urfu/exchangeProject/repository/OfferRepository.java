package ru.urfu.exchangeProject.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import ru.urfu.exchangeProject.model.offer.Offer;
import ru.urfu.exchangeProject.model.offer.OfferStatus;

import java.util.List;

@Repository
public interface OfferRepository extends
        JpaRepository<Offer, Long>,
        JpaSpecificationExecutor<Offer> {

    @Query("""
        SELECT DISTINCT o
        FROM Offer o
        LEFT JOIN o.items item
        WHERE o.id <> :offerId
          AND o.status IN :statuses
          AND (
              o.targetLot.id IN :lotIds
              OR item.lot.id IN :lotIds
          )
        """)
    List<Offer> findOtherOffersByLotIds(
            @Param("offerId") Long offerId,
            @Param("statuses") List<OfferStatus> statuses,
            @Param("lotIds") List<Long> lotIds
    );
}