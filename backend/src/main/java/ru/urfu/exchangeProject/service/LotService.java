package ru.urfu.exchangeProject.service;

import org.springframework.data.domain.Page;
import ru.urfu.exchangeProject.dto.lot.LotCreateRequest;
import ru.urfu.exchangeProject.dto.lot.LotUpdateRequest;
import ru.urfu.exchangeProject.exception.customEx.news.CategoryNotFound;
import ru.urfu.exchangeProject.exception.customEx.news.LotNotFoundException;
import ru.urfu.exchangeProject.model.lot.DeliveryMethod;
import ru.urfu.exchangeProject.model.lot.Lot;
import ru.urfu.exchangeProject.model.lot.LotType;
import ru.urfu.exchangeProject.model.user.User;

import java.math.BigDecimal;

public interface LotService {

    Lot getById(long id) throws LotNotFoundException;

    Lot create(LotCreateRequest lotCreateRequest, String region, User user) throws CategoryNotFound;

    Lot update(LotUpdateRequest lotUpdateRequest, Lot lot) throws CategoryNotFound;

    Lot republicateLot(Lot lot);

    Lot softDelete(Lot lot);

    Page<Lot> searchLots(
            String q,
            Long categoryId,
            String region,
            LotType type,
            boolean delivery,
            boolean pickup,
            BigDecimal minCost,
            BigDecimal maxCost,
            String sort,
            int page,
            int perPage
    ) throws CategoryNotFound;
}
