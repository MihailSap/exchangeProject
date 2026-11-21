package ru.urfu.exchangeProject.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ru.urfu.exchangeProject.PathsConstants;
import ru.urfu.exchangeProject.dto.BaseResponse;
import ru.urfu.exchangeProject.dto.offer.OfferCreateRequest;
import ru.urfu.exchangeProject.dto.offer.OfferResponse;
import ru.urfu.exchangeProject.exception.customEx.UserNotFoundException;
import ru.urfu.exchangeProject.exception.customEx.news.LotNotFoundException;
import ru.urfu.exchangeProject.mapper.OfferMapper;
import ru.urfu.exchangeProject.model.lot.Lot;
import ru.urfu.exchangeProject.model.lot.LotStatus;
import ru.urfu.exchangeProject.model.offer.Offer;
import ru.urfu.exchangeProject.model.user.User;
import ru.urfu.exchangeProject.service.AuthService;
import ru.urfu.exchangeProject.service.LotService;
import ru.urfu.exchangeProject.service.OfferService;
import ru.urfu.exchangeProject.service.UserService;

import java.util.Objects;

@Tag(name = "Офферы")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.OFFERS)
public class OfferController {

    private final AuthService authService;
    private final UserService userService;
    private final LotService lotService;
    private final OfferService offerService;
    private final OfferMapper offerMapper;

    @Autowired
    public OfferController(
            AuthService authService,
            UserService userService,
            LotService lotService,
            OfferService offerService,
            OfferMapper offerMapper
    ) {
        this.authService = authService;
        this.userService = userService;
        this.lotService = lotService;
        this.offerService = offerService;
        this.offerMapper = offerMapper;
    }

    @Operation(description = "Получение предложения обмена")
    @GetMapping("/{id}")
    public BaseResponse<OfferResponse> getById(@PathVariable("id") Long id) throws UserNotFoundException {
        String authenticatedUserEmail = authService.getAuthenticatedUserEmail();
        User authenticatedUser = userService.getByEmail(authenticatedUserEmail);

        Offer offer = offerService.getById(id);
        if(!offer.getRecipient().equals(authenticatedUser)
                && !offer.getInitiator().equals(authenticatedUser)){
            //TODO: Добавить кастомное исключение
            throw new RuntimeException("Доступ отсутствует");
        }
        OfferResponse offerResponse = offerMapper.mapToOfferResponse(offer);
        return new BaseResponse<>(offerResponse);
    }

    @Operation(description = "Создание предложения обмена")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping
    public BaseResponse<OfferResponse> create(
            @RequestBody OfferCreateRequest request
    ) throws UserNotFoundException, LotNotFoundException {
        String authenticatedUserEmail = authService.getAuthenticatedUserEmail();
        User initiator = userService.getByEmail(authenticatedUserEmail);
        Lot targetLot = lotService.getById(request.targetLotId());

        if (Objects.equals(targetLot.getUser().getId(), initiator.getId())) {
            //TODO: Добавить кастомное исключение
            throw new RuntimeException("Нельзя предложить обмен на собственный лот");
        }
        if (targetLot.getStatus() != LotStatus.ACTIVE) {
            //TODO: Добавить кастомное исключение
            throw new RuntimeException("Целевой лот не активен");
        }

        Offer offer = offerService.create(initiator, targetLot, request.offeredLotIds(), request.message());
        OfferResponse offerResponse = offerMapper.mapToOfferResponse(offer);
        return new BaseResponse<>(offerResponse);
    }
}