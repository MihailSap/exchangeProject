package ru.urfu.exchangeProject.service;

import ru.urfu.exchangeProject.dto.lot.want.WantCreateRequest;
import ru.urfu.exchangeProject.exception.customEx.news.CategoryNotFound;
import ru.urfu.exchangeProject.exception.customEx.news.LotNotFoundException;
import ru.urfu.exchangeProject.exception.customEx.news.WantNotFoundException;
import ru.urfu.exchangeProject.model.lot.Lot;
import ru.urfu.exchangeProject.model.lot.want.Want;

public interface WantService {

    Want getById(long id) throws WantNotFoundException;

    Want create(WantCreateRequest wantCreateRequest, Lot lot) throws CategoryNotFound;

    void delete(Want want);
}
