package ru.urfu.exchangeProject.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.urfu.exchangeProject.dto.lot.want.WantCreateRequest;
import ru.urfu.exchangeProject.exception.customEx.news.CategoryNotFound;
import ru.urfu.exchangeProject.exception.customEx.news.LotNotFoundException;
import ru.urfu.exchangeProject.exception.customEx.news.WantNotFoundException;
import ru.urfu.exchangeProject.model.category.Category;
import ru.urfu.exchangeProject.model.lot.Lot;
import ru.urfu.exchangeProject.model.lot.want.Want;
import ru.urfu.exchangeProject.model.lot.want.WantType;
import ru.urfu.exchangeProject.repository.WantRepository;
import ru.urfu.exchangeProject.service.CategoryService;
import ru.urfu.exchangeProject.service.WantService;

import java.time.Instant;

@Service
public class WantServiceImpl implements WantService {

    private final WantRepository wantRepository;
    private final CategoryService categoryService;

    @Autowired
    public WantServiceImpl(
            WantRepository wantRepository,
            CategoryService categoryService
    ) {
        this.wantRepository = wantRepository;
        this.categoryService = categoryService;
    }

    @Transactional(readOnly = true)
    @Override
    public Want getById(long id) throws WantNotFoundException {
        return wantRepository.findById(id)
                .orElseThrow(() -> new WantNotFoundException("Пожелание не найдено"));
    }

    @Transactional
    @Override
    public Want create(WantCreateRequest wantCreateRequest, Lot lot) throws CategoryNotFound {
        Want want = new Want();
        want.setLot(lot);
        want.setCreatedAt(Instant.now());

        WantType wantTypeRequest = wantCreateRequest.wantType();
        want.setWantType(wantTypeRequest);

        if(WantType.LOT.equals(wantTypeRequest) || WantType.ANY.equals(wantTypeRequest)){
            want.setTargetLot(wantCreateRequest.targetLot());
        }
        if(WantType.CATEGORY.equals(wantTypeRequest) || WantType.ANY.equals(wantTypeRequest)){
            Category category = categoryService.findById(wantCreateRequest.targetCategoryId());
            want.setCategory(category);
        }
        if(WantType.KEYWORDS.equals(wantTypeRequest) || WantType.ANY.equals(wantTypeRequest)){
            want.setKeywords(wantCreateRequest.keywords());
        }

        return wantRepository.save(want);
    }

    @Transactional
    @Override
    public void delete(Want want){
        wantRepository.delete(want);
    }
}
