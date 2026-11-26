package ru.urfu.exchangeProject.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ru.urfu.exchangeProject.PathsConstants;
import ru.urfu.exchangeProject.dto.BaseResponse;
import ru.urfu.exchangeProject.dto.lot.LotListResponse;
import ru.urfu.exchangeProject.dto.lot.LotResponse;
import ru.urfu.exchangeProject.dto.moderation.RejectRequest;
import ru.urfu.exchangeProject.dto.moderation.RejectResponse;
import ru.urfu.exchangeProject.exception.customEx.news.BadRequestException;
import ru.urfu.exchangeProject.exception.customEx.news.LotNotFoundException;
import ru.urfu.exchangeProject.mapper.LotMapper;
import ru.urfu.exchangeProject.model.lot.Lot;
import ru.urfu.exchangeProject.model.lot.LotStatus;
import ru.urfu.exchangeProject.service.LotService;
import ru.urfu.exchangeProject.service.ReviewService;

import java.util.List;

@Tag(name = "Модерация")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAuthority('ADMIN')")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.MODERATION)
public class ModerationController {

    private final LotService lotService;
    private final LotMapper lotMapper;
    private final ReviewService reviewService;

    @Autowired
    public ModerationController(
            LotService lotService,
            LotMapper lotMapper,
            ReviewService reviewService
    ) {
        this.lotService = lotService;
        this.lotMapper = lotMapper;
        this.reviewService = reviewService;
    }

    @Operation(description = "Получение списка лотов на модерации")
    @GetMapping("/lots")
    public LotListResponse getModerationLots(
            @RequestParam(defaultValue = "1")
            @Min(1) int page,
            @RequestParam(name = "per_page", defaultValue = "20")
            @Min(1) int perPage
    ) {
        Page<Lot> lotPage = lotService.getModerationLots(page, perPage);

        List<LotResponse> lotResponses = lotPage
                .map(lot -> lotMapper.mapToLotResponse(lot, reviewService.getReviewStatistics(lot.getUser().getId())))
//                .map(lotMapper::mapToLotResponse)
                .getContent();

        return new LotListResponse(
                lotResponses, new LotListResponse.Meta(page, perPage, lotPage.getTotalElements()));
    }

    @Operation(description = "Одобрение лота")
    @PostMapping("/lots/{lotId}/approve")
    public void approve(@PathVariable("lotId") Long lotId) throws LotNotFoundException {
        Lot lot = lotService.getById(lotId);
        if(lot.getStatus() != LotStatus.MODERATION){
            throw new BadRequestException();
        }
        lotService.approve(lot);
    }

    @Operation(description = "Отклонение лота")
    @PostMapping("/lots/{lotId}/reject")
    public BaseResponse<RejectResponse> reject(@PathVariable("lotId") Long lotId, @RequestBody @Valid RejectRequest request) throws LotNotFoundException {
        Lot lot = lotService.getById(lotId);
        if(lot.getStatus() != LotStatus.MODERATION){
            throw new BadRequestException();
        }
        String rejectReason = request.reason();
        lotService.reject(lot, rejectReason);
        return new BaseResponse<>(new RejectResponse(rejectReason));
    }
}
