package ru.urfu.exchangeProject.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.urfu.exchangeProject.exception.customEx.news.LotNotFoundException;
import ru.urfu.exchangeProject.model.lot.Lot;
import ru.urfu.exchangeProject.model.offer.Offer;
import ru.urfu.exchangeProject.model.offer.OfferStatus;
import ru.urfu.exchangeProject.model.user.User;
import ru.urfu.exchangeProject.repository.LotRepository;
import ru.urfu.exchangeProject.repository.OfferRepository;
import ru.urfu.exchangeProject.service.LotService;
import ru.urfu.exchangeProject.service.OfferService;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class OfferServiceImpl implements OfferService {

    private final OfferRepository offerRepository;
    private final LotService lotService;

    @Autowired
    public OfferServiceImpl(
            OfferRepository offerRepository,
            LotService lotService
    ) {
        this.offerRepository = offerRepository;
        this.lotService = lotService;
    }

    @Transactional(readOnly = true)
    @Override
    public Offer getById(Long id){
        //FIXME: Добавить кастомное исключение
        return offerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Оффер не найден"));
    }

    @Transactional
    @Override
    public Offer create(
            User initiator, Lot targetLot, List<Long> offeredLotIds, String message
    ) throws LotNotFoundException {
        Offer offer = new Offer();
        offer.setInitiator(initiator);
        offer.setRecipient(targetLot.getUser());
        offer.setTargetLot(targetLot);
        offer.setStatus(OfferStatus.SENT);
        offer.setMessage(message);
        offer.setCreatedAt(Instant.now());

        List<Long> lotIds = offeredLotIds != null ? offeredLotIds : List.of();
        for (Long lotId : lotIds) {
            Lot offeredLot = lotService.getById(lotId);
            offer.addItem(offeredLot);
        }

        return offerRepository.save(offer);
    }
}