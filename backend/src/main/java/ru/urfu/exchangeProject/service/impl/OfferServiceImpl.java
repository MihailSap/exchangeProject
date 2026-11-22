package ru.urfu.exchangeProject.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.urfu.exchangeProject.exception.customEx.news.LotNotFoundException;
import ru.urfu.exchangeProject.model.lot.Lot;
import ru.urfu.exchangeProject.model.lot.LotStatus;
import ru.urfu.exchangeProject.model.offer.Offer;
import ru.urfu.exchangeProject.model.offer.OfferItem;
import ru.urfu.exchangeProject.model.offer.OfferStatus;
import ru.urfu.exchangeProject.model.user.User;
import ru.urfu.exchangeProject.repository.LotRepository;
import ru.urfu.exchangeProject.repository.OfferRepository;
import ru.urfu.exchangeProject.service.LotService;
import ru.urfu.exchangeProject.service.OfferService;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import ru.urfu.exchangeProject.model.offer.OfferDirection;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Set;

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
    public Page<Offer> getUserOffers(
            long userId,
            Set<OfferDirection> directions,
            Set<OfferStatus> statuses,
            Pageable pageable
    ) {
        Specification<Offer> specification = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            List<Predicate> directionPredicates = new ArrayList<>();
            boolean allDirections = directions == null || directions.isEmpty();
            if (allDirections || directions.contains(OfferDirection.INCOMING)) {
                directionPredicates.add(criteriaBuilder.equal(root.get("recipient").get("id"), userId));
            }

            if (allDirections || directions.contains(OfferDirection.OUTGOING)) {
                directionPredicates.add(criteriaBuilder.equal(root.get("initiator").get("id"), userId));
            }

            predicates.add(criteriaBuilder.or(
                    directionPredicates.toArray(new Predicate[0])));

            if (statuses != null && !statuses.isEmpty()) {
                predicates.add(root.get("status").in(statuses));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        return offerRepository.findAll(specification, pageable);
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

    @Transactional
    @Override
    public Offer accept(Offer offer, long recipientId) {
        offer.setStatus(OfferStatus.ACCEPTED);

        List<Lot> lots = new ArrayList<>();
        lots.add(offer.getTargetLot());
        offer.getItems().stream()
                .map(OfferItem::getLot)
                .forEach(lots::add);
        for (Lot lot : lots) {
            lot.setStatus(LotStatus.IN_EXCHANGE);
        }
        List<Long> lotIds = lots.stream()
                .map(Lot::getId)
                .distinct()
                .toList();
        List<Offer> otherOffers = offerRepository.findOtherOffersByLotIds(
                offer.getId(), List.of(OfferStatus.SENT, OfferStatus.VIEWED), lotIds);

        for (Offer otherOffer : otherOffers) {
            otherOffer.setStatus(OfferStatus.REJECTED);
        }

        return offerRepository.save(offer);
    }

    @Transactional
    @Override
    public Offer reject(Offer offer) {
        offer.setStatus(OfferStatus.REJECTED);
        return offerRepository.save(offer);
    }

    @Transactional
    @Override
    public Offer cancel(Offer offer) {
        offer.setStatus(OfferStatus.CANCELLED);
        return offerRepository.save(offer);
    }

    @Transactional
    @Override
    public Offer fail(Offer offer) {
        offer.setStatus(OfferStatus.CANCELLED);

        Lot targetLot = offer.getTargetLot();
        targetLot.setStatus(LotStatus.ACTIVE);

        for (OfferItem offerItem : offer.getItems()) {
            offerItem.getLot().setStatus(LotStatus.ACTIVE);
        }

        return offerRepository.save(offer);
    }
}