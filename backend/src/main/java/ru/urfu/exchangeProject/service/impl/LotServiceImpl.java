package ru.urfu.exchangeProject.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import ru.urfu.exchangeProject.dto.lot.LotCreateRequest;
import ru.urfu.exchangeProject.dto.lot.LotUpdateRequest;
import ru.urfu.exchangeProject.dto.lot.want.WantCreateRequest;
import ru.urfu.exchangeProject.exception.customEx.news.CategoryNotFound;
import ru.urfu.exchangeProject.exception.customEx.news.LotNotFoundException;
import ru.urfu.exchangeProject.model.category.Category;
import ru.urfu.exchangeProject.model.lot.DeliveryMethod;
import ru.urfu.exchangeProject.model.lot.Lot;
import ru.urfu.exchangeProject.model.lot.LotStatus;
import ru.urfu.exchangeProject.model.lot.LotType;
import ru.urfu.exchangeProject.model.user.User;
import ru.urfu.exchangeProject.repository.LotRepository;
import ru.urfu.exchangeProject.service.CategoryService;
import ru.urfu.exchangeProject.service.LotPhotoService;
import ru.urfu.exchangeProject.service.LotService;
import ru.urfu.exchangeProject.service.WantService;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class LotServiceImpl implements LotService {

    private final LotRepository lotRepository;
    private final CategoryService categoryService;
    private final LotPhotoService lotPhotoService;
    private final WantService wantService;

    @Autowired
    public LotServiceImpl(
            LotRepository lotRepository,
            CategoryService categoryService,
            LotPhotoService lotPhotoService, WantService wantService
    ) {
        this.lotRepository = lotRepository;
        this.categoryService = categoryService;
        this.lotPhotoService = lotPhotoService;
        this.wantService = wantService;
    }

    @Transactional(readOnly = true)
    @Override
    public Lot getById(long id) throws LotNotFoundException {
        return lotRepository.findById(id)
                .orElseThrow(() -> new LotNotFoundException("Лот не найден"));
    }

    @Transactional
    @Override
    public Lot create(LotCreateRequest lotCreateRequest, String region, User user) throws CategoryNotFound {
        Lot lot = new Lot();
        lot.setTitle(lotCreateRequest.title());
        lot.setDescription(lotCreateRequest.description());
        lot.setRegion(region);
        lot.setType(lotCreateRequest.type());
        lot.setDeliveryMethod(lotCreateRequest.deliveryMethod());
        lot.setEstimatedCost(lotCreateRequest.estimatedCost());
        lot.setUser(user);
        lot.setStatus(LotStatus.MODERATION);
        lot.setCreatedAt(Instant.now());
        lot.setUpdatedAt(Instant.now());

        Category category = categoryService.findById(lotCreateRequest.categoryId());
        lot.setCategory(category);
        lotRepository.save(lot);

        List<MultipartFile> photos = lotCreateRequest.photos();
        if(photos != null && !photos.isEmpty()){
            int order = 1;
            for(MultipartFile photo : photos){
                lotPhotoService.create(lot, photo, order++);
            }
        }

        createWantsForLot(lotCreateRequest.wants(), lot);

        return lotRepository.save(lot);
    }

    @Transactional
    @Override
    public Lot update(LotUpdateRequest lotUpdateRequest, Lot lot) throws CategoryNotFound {
        String title = lotUpdateRequest.title();
        if(title != null && !title.isBlank()){
            lot.setTitle(title);
        }

        String description = lotUpdateRequest.description();
        if(description != null && !description.isBlank()){
            lot.setDescription(description);
        }

        Long categoryId = lotUpdateRequest.categoryId();
        if(categoryId != null){
            Category category = categoryService.findById(categoryId);
            lot.setCategory(category);
        }

        String region = lotUpdateRequest.region();
        if(region != null && !region.isBlank()){
            lot.setRegion(region);
        }

        LotType lotType = lotUpdateRequest.type();
        if(lotType != null){
            lot.setType(lotType);
        }

        DeliveryMethod deliveryMethod = lotUpdateRequest.deliveryMethod();
        if(deliveryMethod != null){
            lot.setDeliveryMethod(deliveryMethod);
        }

        BigDecimal estimatedCost = lotUpdateRequest.estimatedCost();
        if(estimatedCost != null){
            lot.setEstimatedCost(estimatedCost);
        }

        List<MultipartFile> photos = lotUpdateRequest.photos();
        if(photos != null && !photos.isEmpty()){
            int order = lotPhotoService.getMaxOrder(lot.getLotPhotoDataList());
            for(MultipartFile photo : photos){
                lotPhotoService.create(lot, photo, order++);
            }
        }

        createWantsForLot(lotUpdateRequest.wants(), lot);

        lot.setStatus(LotStatus.MODERATION);
        lot.setUpdatedAt(Instant.now());
        return lotRepository.save(lot);
    }

    @Transactional
    @Override
    public Lot republicateLot(Lot lot){
        lot.setStatus(LotStatus.ACTIVE);
        lot.setPublishedAt(Instant.now());
        lot.setExpiresAt(Instant.now().plus(30, ChronoUnit.DAYS));
        return lotRepository.save(lot);
    }

    @Transactional
    @Override
    public Lot softDelete(Lot lot) {
        lot.setStatus(LotStatus.DELETED);
        return lotRepository.save(lot);
    }

    @Transactional
    private void createWantsForLot(List<WantCreateRequest> wantCreateRequests, Lot lot) throws CategoryNotFound {
        if(wantCreateRequests != null && !wantCreateRequests.isEmpty()){
            for(WantCreateRequest wantCreateRequest : wantCreateRequests){
                wantService.create(wantCreateRequest, lot);
            }
        }
    }
}
