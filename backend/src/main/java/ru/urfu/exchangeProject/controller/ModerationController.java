package ru.urfu.exchangeProject.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import ru.urfu.exchangeProject.PathsConstants;
import ru.urfu.exchangeProject.dto.BaseResponse;
import ru.urfu.exchangeProject.dto.moderation.RejectRequest;
import ru.urfu.exchangeProject.dto.moderation.RejectResponse;
import ru.urfu.exchangeProject.exception.customEx.news.BadRequestException;
import ru.urfu.exchangeProject.exception.customEx.news.LotNotFoundException;
import ru.urfu.exchangeProject.model.lot.Lot;
import ru.urfu.exchangeProject.model.lot.LotStatus;
import ru.urfu.exchangeProject.service.LotService;

@Tag(name = "Лоты")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAuthority('ADMIN')")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.MODERATION)
public class ModerationController {

    private final LotService lotService;

    @Autowired
    public ModerationController(
            LotService lotService
    ) {
        this.lotService = lotService;
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
