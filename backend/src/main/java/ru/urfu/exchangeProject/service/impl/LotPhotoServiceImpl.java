package ru.urfu.exchangeProject.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import ru.urfu.exchangeProject.exception.customEx.news.LotPhotoNotFoundException;
import ru.urfu.exchangeProject.model.lot.Lot;
import ru.urfu.exchangeProject.model.lot.LotPhoto;
import ru.urfu.exchangeProject.repository.LotPhotoDataRepository;
import ru.urfu.exchangeProject.service.FileService;
import ru.urfu.exchangeProject.service.LotPhotoService;

import java.time.Instant;
import java.util.List;

@Service
public class LotPhotoServiceImpl implements LotPhotoService {

    private final LotPhotoDataRepository lotPhotoDataRepository;
    private final FileService fileService;

    @Autowired
    public LotPhotoServiceImpl(
            LotPhotoDataRepository lotPhotoDataRepository,
            FileService fileService
    ) {
        this.lotPhotoDataRepository = lotPhotoDataRepository;
        this.fileService = fileService;
    }

    @Transactional(readOnly = true)
    @Override
    public LotPhoto getById(long id) throws LotPhotoNotFoundException {
        return lotPhotoDataRepository.findById(id)
                .orElseThrow(() -> new LotPhotoNotFoundException("Фото не найдено"));
    }

    @Override
    public int getMaxOrder(List<LotPhoto> photos) {
        return photos.stream()
                .mapToInt(LotPhoto::getOrder)
                .max()
                .orElse(1);
    }

    @Transactional
    @Override
    public LotPhoto create(Lot lot, MultipartFile photo, int order){
        LotPhoto lotPhoto = new LotPhoto();
        lotPhoto.setOrder(order);
        lotPhoto.setLot(lot);
        lotPhoto.setCreatedAt(Instant.now());

        String fileName = fileService.save(photo);
        lotPhoto.setName(fileName);

        return lotPhotoDataRepository.save(lotPhoto);
    }

    @Transactional
    @Override
    public void delete(LotPhoto lotPhoto){
        fileService.delete(lotPhoto.getName());
        lotPhotoDataRepository.delete(lotPhoto);
    }
}
