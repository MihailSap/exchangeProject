package ru.urfu.exchangeProject.service;

import ru.urfu.exchangeProject.dto.lot.LotCreateRequest;
import ru.urfu.exchangeProject.dto.lot.LotUpdateRequest;
import ru.urfu.exchangeProject.exception.customEx.news.CategoryNotFound;
import ru.urfu.exchangeProject.exception.customEx.news.LotNotFoundException;
import ru.urfu.exchangeProject.model.lot.Lot;
import ru.urfu.exchangeProject.model.user.User;

public interface LotService {

    Lot getById(long id) throws LotNotFoundException;

    Lot create(LotCreateRequest lotCreateRequest, String region, User user) throws CategoryNotFound;

    Lot update(LotUpdateRequest lotUpdateRequest, Lot lot) throws CategoryNotFound;

    Lot republicateLot(Lot lot);

    Lot softDelete(Lot lot);
}
