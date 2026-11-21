package ru.urfu.exchangeProject.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ru.urfu.exchangeProject.PathsConstants;
import ru.urfu.exchangeProject.dto.BaseResponse;
import ru.urfu.exchangeProject.dto.exceptions.ErrorCode;
import ru.urfu.exchangeProject.dto.offer.OfferCreateRequest;
import ru.urfu.exchangeProject.dto.offer.OfferResponse;
import ru.urfu.exchangeProject.exception.customEx.UserNotFoundException;
import ru.urfu.exchangeProject.exception.customEx.news.AccountFrozenException;
import ru.urfu.exchangeProject.exception.customEx.news.EmailNotConfirmedException;
import ru.urfu.exchangeProject.exception.customEx.news.LotConflictException;
import ru.urfu.exchangeProject.exception.customEx.news.LotNotFoundException;
import ru.urfu.exchangeProject.exception.globalEx.ConflictException;
import ru.urfu.exchangeProject.exception.globalEx.ForbiddenException;
import ru.urfu.exchangeProject.mapper.OfferMapper;
import ru.urfu.exchangeProject.model.lot.Lot;
import ru.urfu.exchangeProject.model.lot.LotStatus;
import ru.urfu.exchangeProject.model.offer.Offer;
import ru.urfu.exchangeProject.model.offer.OfferStatus;
import ru.urfu.exchangeProject.model.user.User;
import ru.urfu.exchangeProject.model.user.UserStatus;
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
            throw new ForbiddenException(ErrorCode.ACCESS_DENIED);
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
        validateUser(initiator);

        Lot targetLot = lotService.getById(request.targetLotId());

        if (Objects.equals(targetLot.getUser().getId(), initiator.getId())) {
            throw new ConflictException(ErrorCode.SELF_OFFER_NOT_ALLOWED);
        }
        if (targetLot.getStatus() != LotStatus.ACTIVE) {
            throw new LotConflictException();
        }

        Offer offer = offerService.create(initiator, targetLot, request.offeredLotIds(), request.message());
        OfferResponse offerResponse = offerMapper.mapToOfferResponse(offer);
        return new BaseResponse<>(offerResponse);
    }

    @Operation(description = "Принятие оффера")
    @PostMapping("/{id}/accept")
    public BaseResponse<OfferResponse> accept(@PathVariable("id") long id)
            throws UserNotFoundException {
        String authenticatedUserEmail = authService.getAuthenticatedUserEmail();
        User user = userService.getByEmail(authenticatedUserEmail);
        validateUser(user);

        Offer offer = offerService.getById(id);
        validateRecipient(offer.getRecipient().getId(), user.getId());
        validateOfferStatus(offer);

        Offer acceptedOffer = offerService.accept(offer, user.getId());
        OfferResponse offerResponse = offerMapper.mapToOfferResponse(acceptedOffer);
        return new BaseResponse<>(offerResponse);
    }

    @Operation(description = "Отклонение оффера")
    @PostMapping("/{id}/reject")
    public BaseResponse<OfferResponse> reject(@PathVariable("id") long id) throws UserNotFoundException {
        String authenticatedUserEmail = authService.getAuthenticatedUserEmail();
        User user = userService.getByEmail(authenticatedUserEmail);
        validateUser(user);

        Offer offer = offerService.getById(id);
        validateRecipient(offer.getRecipient().getId(), user.getId());
        validateOfferStatus(offer);

        Offer rejectedOffer = offerService.reject(offer);
        OfferResponse offerResponse = offerMapper.mapToOfferResponse(rejectedOffer);
        return new BaseResponse<>(offerResponse);
    }

    @Operation(description = "Отмена оффера")
    @PostMapping("/{id}/cancel")
    public BaseResponse<OfferResponse> cancel(@PathVariable("id") long id) throws UserNotFoundException {
        String authenticatedUserEmail = authService.getAuthenticatedUserEmail();
        User user = userService.getByEmail(authenticatedUserEmail);
        validateUser(user);

        Offer offer = offerService.getById(id);
        validateInitiator(offer.getInitiator().getId(), user.getId());
        validateOfferStatus(offer);

        Offer rejectedOffer = offerService.cancel(offer);
        OfferResponse offerResponse = offerMapper.mapToOfferResponse(rejectedOffer);
        return new BaseResponse<>(offerResponse);
    }

    @Operation(description = "Фиксация неуспешного обмена")
    @PostMapping("/{id}/fail")
    public BaseResponse<OfferResponse> fail(@PathVariable("id") long id)
            throws UserNotFoundException {
        String authenticatedUserEmail = authService.getAuthenticatedUserEmail();
        User user = userService.getByEmail(authenticatedUserEmail);
        validateUser(user);

        Offer offer = offerService.getById(id);
        validateParticipant(offer, user.getId());
        validateAcceptedOfferStatus(offer);

        Offer failedOffer = offerService.fail(offer);
        OfferResponse offerResponse = offerMapper.mapToOfferResponse(failedOffer);
        return new BaseResponse<>(offerResponse);
    }

    private void validateUser(User user) {
        if(UserStatus.FROZEN.equals(user.getStatus())){
            throw new AccountFrozenException(user.getFrozenReason());
        }
        if(!user.isEmailConfirmed()){
            throw new EmailNotConfirmedException();
        }
    }

    private void validateRecipient(long offerRecipientId, long authenticatedUserId){
        if (!Objects.equals(offerRecipientId, authenticatedUserId)) {
            throw new ForbiddenException(ErrorCode.NOT_OFFER_RECIPIENT);
        }
    }

    private void validateInitiator(long offerInitiatorId, long authenticatedUserId){
        if (!Objects.equals(offerInitiatorId, authenticatedUserId)) {
            throw new ForbiddenException(ErrorCode.NOT_OFFER_INITIATOR);
        }
    }

    private void validateParticipant(Offer offer, long authenticatedUserId) {
        if (!Objects.equals(offer.getInitiator().getId(), authenticatedUserId)
                && !Objects.equals(offer.getRecipient().getId(), authenticatedUserId)) {
            throw new ForbiddenException(ErrorCode.NOT_OFFER_PARTICIPANT);
        }
    }

    private void validateAcceptedOfferStatus(Offer offer) {
        if (offer.getStatus() != OfferStatus.ACCEPTED) {
            throw new ConflictException(ErrorCode.INVALID_STATUS_TRANSITION);
        }
    }

    private void validateOfferStatus(Offer offer){
        OfferStatus offerStatus = offer.getStatus();
        if(offerStatus != OfferStatus.SENT && offerStatus != OfferStatus.VIEWED){
            throw new ConflictException(ErrorCode.INVALID_STATUS_TRANSITION);
        }
    }
}