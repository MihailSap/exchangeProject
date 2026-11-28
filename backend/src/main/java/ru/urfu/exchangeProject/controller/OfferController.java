package ru.urfu.exchangeProject.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import ru.urfu.exchangeProject.PathsConstants;
import ru.urfu.exchangeProject.dto.BaseResponse;
import ru.urfu.exchangeProject.dto.exceptions.ErrorCode;
import ru.urfu.exchangeProject.dto.offer.OfferCreateRequest;
import ru.urfu.exchangeProject.dto.offer.OfferResponse;
import ru.urfu.exchangeProject.exception.customEx.UserNotFoundException;
import ru.urfu.exchangeProject.exception.customEx.news.*;
import ru.urfu.exchangeProject.exception.globalEx.ConflictException;
import ru.urfu.exchangeProject.exception.globalEx.ForbiddenException;
import ru.urfu.exchangeProject.mapper.OfferMapper;
import ru.urfu.exchangeProject.model.lot.Lot;
import ru.urfu.exchangeProject.model.lot.LotStatus;
import ru.urfu.exchangeProject.model.offer.Offer;
import ru.urfu.exchangeProject.model.offer.OfferItem;
import ru.urfu.exchangeProject.model.offer.OfferStatus;
import ru.urfu.exchangeProject.model.user.User;
import ru.urfu.exchangeProject.model.user.UserStatus;
import ru.urfu.exchangeProject.service.AuthService;
import ru.urfu.exchangeProject.service.LotService;
import ru.urfu.exchangeProject.service.OfferService;
import ru.urfu.exchangeProject.model.offer.OfferDirection;

import java.util.*;
import java.util.stream.Collectors;

@Tag(name = "Офферы")
@SecurityRequirement(name = "bearerAuth")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.OFFERS)
public class OfferController {

    private final AuthService authService;
    private final LotService lotService;
    private final OfferService offerService;
    private final OfferMapper offerMapper;

    @Autowired
    public OfferController(
            AuthService authService,
            LotService lotService,
            OfferService offerService,
            OfferMapper offerMapper
    ) {
        this.authService = authService;
        this.lotService = lotService;
        this.offerService = offerService;
        this.offerMapper = offerMapper;
    }

    @Operation(description = "Получение офферов текущего пользователя")
    @GetMapping
    public BaseResponse<Page<OfferResponse>> getCurrentUserOffers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(name = "per_page", defaultValue = "20") int perPage,
            @RequestParam(required = false) String direction,
            @RequestParam(required = false) String status
    ) {
        if (page < 1 || perPage < 1 || perPage > 100_000) {
            throw new BadRequestException();
        }

        Set<OfferDirection> directions = parseEnumParameter(direction, OfferDirection.class);
        Set<OfferStatus> statuses = parseEnumParameter(status, OfferStatus.class);
        User user = authService.getAuthenticatedUser();
        PageRequest pageable = PageRequest.of(page - 1, perPage, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<OfferResponse> offers = offerService.getUserOffers(
                user.getId(),
                directions,
                statuses,
                pageable
        ).map(offerMapper::mapToOfferResponse);
        return new BaseResponse<>(offers);
    }

    private <T extends Enum<T>> Set<T> parseEnumParameter(
            String value,
            Class<T> enumType
    ) {
        if (value == null || value.isBlank()) {
            return Set.of();
        }

        try {
            return Arrays.stream(value.split("\\|", -1))
                    .map(String::trim)
                    .map(item -> Enum.valueOf(
                            enumType,
                            item.toUpperCase(Locale.ROOT)
                    ))
                    .collect(Collectors.toCollection(LinkedHashSet::new));
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException();
        }
    }

    @Operation(description = "Получение предложения обмена")
    @GetMapping("/{id}")
    public BaseResponse<OfferResponse> getById(@PathVariable("id") Long id) throws UserNotFoundException {
        User authenticatedUser = authService.getAuthenticatedUser();

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
        User initiator = authService.getAuthenticatedUser();
        validateUser(initiator);

        Lot targetLot = lotService.getById(request.targetLotId());

        if (Objects.equals(targetLot.getUser().getId(), initiator.getId())) {
            throw new ConflictException(ErrorCode.SELF_OFFER_NOT_ALLOWED);
        }
        if (targetLot.getStatus() != LotStatus.ACTIVE) {
            throw new LotConflictException();
        }

        List<Long> offeredLotIds = request.offeredLotIds();
        if (offeredLotIds == null){
            throw new BadRequestException();
        }

        List<Long> offeredLotIdsFiltered = offeredLotIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if(offeredLotIdsFiltered.isEmpty()){
            throw new BadRequestException();
        }
        for(Long offeredLotId : offeredLotIdsFiltered){
            Lot lot = lotService.getById(offeredLotId);
            if(!initiator.equals(lot.getUser())){
                throw new LotForbiddenException();
            }
        }

        Offer offer = offerService.create(initiator, targetLot, offeredLotIdsFiltered, request.message());
        OfferResponse offerResponse = offerMapper.mapToOfferResponse(offer);
        return new BaseResponse<>(offerResponse);
    }

    @Operation(description = "Принятие оффера")
    @PostMapping("/{id}/accept")
    public BaseResponse<OfferResponse> accept(@PathVariable("id") long id)
            throws UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        validateUser(user);

        Offer offer = offerService.getById(id);
        validateRecipient(offer.getRecipient().getId(), user.getId());
        validateOfferStatus(offer);
        validateOfferLots(offer);

        Offer acceptedOffer = offerService.accept(offer, user.getId());
        OfferResponse offerResponse = offerMapper.mapToOfferResponse(acceptedOffer);
        return new BaseResponse<>(offerResponse);
    }

    @Operation(description = "Отклонение оффера")
    @PostMapping("/{id}/reject")
    public BaseResponse<OfferResponse> reject(@PathVariable("id") long id) throws UserNotFoundException {
        String authenticatedUserEmail = authService.getAuthenticatedUserEmail();
        User user = authService.getAuthenticatedUser();
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
        User user = authService.getAuthenticatedUser();
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
        User user = authService.getAuthenticatedUser();
        validateUser(user);

        Offer offer = offerService.getById(id);
        validateParticipant(offer, user.getId());
        validateOfferStatusToFail(offer);

        Offer failedOffer = offerService.fail(offer);
        OfferResponse offerResponse = offerMapper.mapToOfferResponse(failedOffer);
        return new BaseResponse<>(offerResponse);
    }

    @Operation(description = "Завершение лота")
    @PostMapping("/{id}/complete")
    public BaseResponse<OfferResponse> complete(@PathVariable("id") Long id){
        User user = authService.getAuthenticatedUser();
        validateUser(user);

        Offer offer = offerService.getById(id);
        validateParticipant(offer, user.getId());
        if(offer.getStatus() != OfferStatus.ACCEPTED && offer.getStatus() != OfferStatus.HALF_COMPLETED){
            throw new ConflictException(ErrorCode.INVALID_STATUS_TRANSITION);
        }

        Offer updatedOffer = offerService.complete(offer, user);
        OfferResponse offerResponse = offerMapper.mapToOfferResponse(updatedOffer);
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

    private void validateOfferStatusToFail(Offer offer) {
        if (offer.getStatus() != OfferStatus.ACCEPTED && offer.getStatus() != OfferStatus.HALF_COMPLETED) {
            throw new ConflictException(ErrorCode.INVALID_STATUS_TRANSITION);
        }
    }

    private void validateOfferStatus(Offer offer){
        OfferStatus offerStatus = offer.getStatus();
        if(offerStatus != OfferStatus.SENT && offerStatus != OfferStatus.VIEWED){
            throw new ConflictException(ErrorCode.INVALID_STATUS_TRANSITION);
        }
    }

    private void validateOfferLots(Offer offer){
        if(offer.getTargetLot().getStatus() == LotStatus.ACTIVE){
            throw new LotConflictException();
        }

        for(OfferItem offerItem : offer.getItems()) {
            if(offerItem.getLot().getStatus() != LotStatus.ACTIVE){
                throw new LotConflictException();
            }
        }
    }
}