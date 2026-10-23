package ru.urfu.exchangeProject.mapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import ru.urfu.exchangeProject.dto.lot.want.WantResponse;
import ru.urfu.exchangeProject.model.lot.want.Want;
import ru.urfu.exchangeProject.model.lot.want.WantType;

import java.util.ArrayList;
import java.util.List;

@Component
public class WantMapper {

    private final CategoryMapper categoryMapper;

    @Autowired
    public WantMapper(CategoryMapper categoryMapper) {
        this.categoryMapper = categoryMapper;
    }

    public List<WantResponse> mapToWantResponses(List<Want> wants){
        List<WantResponse> wantRespons = new ArrayList<>();
        for(Want want : wants){
            wantRespons.add(mapToWantResponse(want));
        }
        return wantRespons;
    }

    public WantResponse mapToWantResponse(Want want){
        WantType wantType = want.getWantType();
        return new WantResponse(
                wantType,
                WantType.KEYWORDS.equals(wantType) || WantType.ANY.equals(wantType) ? want.getKeywords() : null,
                WantType.CATEGORY.equals(wantType) || WantType.ANY.equals(wantType)
                        ? categoryMapper.mapToCategoryShortResponse(want.getCategory()) : null,
                WantType.LOT.equals(wantType) || WantType.ANY.equals(wantType) ? want.getTargetLot() : null
        );
    }
}
