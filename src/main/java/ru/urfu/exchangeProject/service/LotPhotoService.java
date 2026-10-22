package ru.urfu.exchangeProject.service;

import org.springframework.web.multipart.MultipartFile;
import ru.urfu.exchangeProject.exception.customEx.news.LotPhotoNotFoundException;
import ru.urfu.exchangeProject.model.lot.Lot;
import ru.urfu.exchangeProject.model.lot.LotPhoto;

import java.util.List;

public interface LotPhotoService {

    int getMaxOrder(List<LotPhoto> photos);

    LotPhoto getById(long id) throws LotPhotoNotFoundException;

    LotPhoto create(Lot lot, MultipartFile photo, int order);

    void delete(LotPhoto lotPhoto);
}
