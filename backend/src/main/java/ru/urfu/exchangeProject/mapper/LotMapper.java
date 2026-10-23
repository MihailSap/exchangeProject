package ru.urfu.exchangeProject.mapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import ru.urfu.exchangeProject.dto.lot.LotPhotoDataResponse;
import ru.urfu.exchangeProject.dto.lot.LotResponse;
import ru.urfu.exchangeProject.model.lot.Lot;
import ru.urfu.exchangeProject.model.lot.LotPhoto;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Component
public class LotMapper {

    private final CategoryMapper categoryMapper;
    private final UserMapper userMapper;
    private final WantMapper wantMapper;

    @Autowired
    public LotMapper(
            CategoryMapper categoryMapper,
            UserMapper userMapper,
            WantMapper wantMapper
    ) {
        this.categoryMapper = categoryMapper;
        this.userMapper = userMapper;
        this.wantMapper = wantMapper;
    }

    public LotResponse mapToLotResponse(Lot lot) {
        return new LotResponse(
                lot.getId(),
                lot.getTitle(),
                lot.getDescription(),
                lot.getType(),
                lot.getDeliveryMethod(),
                lot.getEstimatedCost(),
                categoryMapper.mapToCategoryShortResponse(lot.getCategory()),
                lot.getRegion(),
                mapToLotPhotoDataResponses(lot.getLotPhotoDataList()),
                userMapper.mapToUserShortResponse(lot.getUser()),
                wantMapper.mapToWantResponses(lot.getWants()),
                lot.getStatus(),
                lot.getPublishedAt(),
                lot.getExpiresAt()
        );
    }

    private List<LotPhotoDataResponse> mapToLotPhotoDataResponses(List<LotPhoto> lotPhotoList){
        List<LotPhotoDataResponse> lotPhotoDataResponses = new ArrayList<>();
        for(LotPhoto lotPhoto : lotPhotoList){
            lotPhotoDataResponses.add(mapToLotPhotoDataResponse(lotPhoto));
        }

        lotPhotoDataResponses.sort(Comparator.comparingInt(LotPhotoDataResponse::order));
        return lotPhotoDataResponses;
    }

    private LotPhotoDataResponse mapToLotPhotoDataResponse(LotPhoto lotPhoto){
        return new LotPhotoDataResponse(lotPhoto.getOrder(), lotPhoto.getName());
    }
}
