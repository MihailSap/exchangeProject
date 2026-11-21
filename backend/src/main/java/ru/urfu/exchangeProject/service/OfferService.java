package ru.urfu.exchangeProject.service;

import ru.urfu.exchangeProject.exception.customEx.news.LotNotFoundException;
import ru.urfu.exchangeProject.model.lot.Lot;
import ru.urfu.exchangeProject.model.offer.Offer;
import ru.urfu.exchangeProject.model.user.User;

import java.util.List;

public interface OfferService {

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
}