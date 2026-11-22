package ru.urfu.exchangeProject.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import ru.urfu.exchangeProject.exception.customEx.news.LotNotFoundException;
import ru.urfu.exchangeProject.model.lot.Lot;
import ru.urfu.exchangeProject.model.offer.Offer;
import ru.urfu.exchangeProject.model.offer.OfferDirection;
import ru.urfu.exchangeProject.model.offer.OfferStatus;
import ru.urfu.exchangeProject.model.user.User;

import java.util.List;
import java.util.Set;

public interface OfferService {

    Page<Offer> getUserOffers(
            long userId,
            Set<OfferDirection> directions,
            Set<OfferStatus> statuses,
            Pageable pageable
    );

    Offer getById(Long id);

    Offer create(
            User initiator,
            Lot targetLot,
            List<Long> offeredLotIds,
            String message
    ) throws LotNotFoundException;

    Offer accept(Offer offer, long recipientId);

    Offer reject(Offer offer);

    Offer cancel(Offer offer);

    Offer fail(Offer offer);

    Offer complete(Offer offer, User authenticatedUser);
}