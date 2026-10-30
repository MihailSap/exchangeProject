package ru.urfu.exchangeProject.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.urfu.exchangeProject.PathsConstants;
import ru.urfu.exchangeProject.dto.BaseResponse;
import ru.urfu.exchangeProject.dto.regions.RegionsResponse;
import ru.urfu.exchangeProject.service.impl.RegionsProperties;

import java.util.List;

@Tag(name = "Регионы")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.REGIONS)
public class RegionsController {

    private final RegionsProperties regionsProperties;

    @Autowired
    public RegionsController(RegionsProperties regionsProperties) {
        this.regionsProperties = regionsProperties;
    }

    @Operation(description = "Получение регионов")
    @GetMapping
    public BaseResponse<RegionsResponse> getRegions(){
        List<String> regions = regionsProperties.getRegions();
        return new BaseResponse<>(new RegionsResponse(regions));
    }
}
