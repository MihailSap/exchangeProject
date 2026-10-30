package ru.urfu.exchangeProject.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ru.urfu.exchangeProject.PathsConstants;
import ru.urfu.exchangeProject.dto.BaseResponse;
import ru.urfu.exchangeProject.dto.lot.LotCreateRequest;
import ru.urfu.exchangeProject.dto.lot.LotResponse;
import ru.urfu.exchangeProject.dto.lot.LotUpdateRequest;
import ru.urfu.exchangeProject.exception.customEx.UserNotFoundException;
import ru.urfu.exchangeProject.exception.customEx.news.*;
import ru.urfu.exchangeProject.mapper.LotMapper;
import ru.urfu.exchangeProject.model.lot.Lot;
import ru.urfu.exchangeProject.model.lot.LotPhoto;
import ru.urfu.exchangeProject.model.lot.LotStatus;
import ru.urfu.exchangeProject.model.lot.want.Want;
import ru.urfu.exchangeProject.model.user.User;
import ru.urfu.exchangeProject.model.user.UserStatus;
import ru.urfu.exchangeProject.service.*;

@Tag(name = "Лоты")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.LOTS)
public class LotController {

    private final AuthService authService;
    private final UserService userService;
    private final LotService lotService;
    private final WantService wantService;
    private final LotPhotoService lotPhotoService;
    private final LotMapper lotMapper;

    @Autowired
    public LotController(
            AuthService authService,
            UserService userService,
            LotService lotService,
            WantService wantService,
            LotPhotoService lotPhotoService,
            LotMapper lotMapper
    ) {
        this.authService = authService;
        this.userService = userService;
        this.lotService = lotService;
        this.wantService = wantService;
        this.lotPhotoService = lotPhotoService;
        this.lotMapper = lotMapper;
    }

    @Operation(description = "Получение лота по id")
    @GetMapping("/{id}")
    public BaseResponse<LotResponse> getById(@PathVariable("id") long id) throws LotNotFoundException {
        Lot lot = lotService.getById(id);
        LotResponse lotResponse = lotMapper.mapToLotResponse(lot);
        return new BaseResponse<>(lotResponse);
    }

    @Operation(description = "Создание лота")
    @SecurityRequirement(name = "bearerAuth")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping
    public BaseResponse<LotResponse> create(@ModelAttribute LotCreateRequest lotCreateRequest)
            throws UserNotFoundException, CategoryNotFound {
        String authenticatedUserEmail = authService.getAuthenticatedUserEmail();
        User user = userService.getByEmail(authenticatedUserEmail);
        if(UserStatus.FROZEN.equals(user.getStatus())){
            throw new AccountFrozenException(user.getFrozenReason());
        }
        if(!user.isEmailConfirmed()){
            throw new EmailNotConfirmedException();
        }

        String region;
        String requestRegion = lotCreateRequest.region();
        if(requestRegion != null && !requestRegion.isBlank()){
            region = requestRegion;
        } else {
            region = user.getRegion();
        }

        Lot lot = lotService.create(lotCreateRequest, region, user);
        LotResponse lotResponse = lotMapper.mapToLotResponse(lot);
        return new BaseResponse<>(lotResponse);
    }

    @Operation(description = "Обновление лота")
    @SecurityRequirement(name = "bearerAuth")
    @PatchMapping("/{id}")
    public BaseResponse<LotResponse> update(
            @PathVariable("id") long id, @RequestBody LotUpdateRequest lotUpdateRequest)
            throws UserNotFoundException, CategoryNotFound, LotNotFoundException {
        String authenticatedUserEmail = authService.getAuthenticatedUserEmail();
        User user = userService.getByEmail(authenticatedUserEmail);
        if(UserStatus.FROZEN.equals(user.getStatus())){
            throw new AccountFrozenException(user.getFrozenReason());
        }
        if(!user.isEmailConfirmed()){
            throw new EmailNotConfirmedException();
        }

        Lot lot = lotService.getById(id);
        validateOwner(lot.getUser());

        if(LotStatus.IN_EXCHANGE.equals(lot.getStatus()) || LotStatus.COMPLETED.equals(lot.getStatus())){
            throw new RuntimeException("Нельзя редактировать лот с указанным статусом");
        }

        Lot updatedLot = lotService.update(lotUpdateRequest, lot);
        LotResponse lotResponse = lotMapper.mapToLotResponse(updatedLot);
        return new BaseResponse<>(lotResponse);
    }

    @Operation(description = "Мягкое удаление лота")
    @SecurityRequirement(name = "bearerAuth")
    @DeleteMapping("/{lotId}")
    public void softDelete(@PathVariable("lotId") long lotId) throws LotNotFoundException, UserNotFoundException {
        Lot lot = lotService.getById(lotId);
        validateOwner(lot.getUser());
        lotService.softDelete(lot);
    }

    @Operation(description = "Перепубликация архивного лота")
    @PatchMapping("/{lotId}/republicate")
    public BaseResponse<LotResponse> republicateLot(@PathVariable("lotId") long lotId)
            throws LotNotFoundException, UserNotFoundException {
        Lot lot = lotService.getById(lotId);
        validateOwner(lot.getUser());

        if(!LotStatus.ARCHIVED.equals(lot.getStatus())){
            throw new RuntimeException("Разархивировать лот без статуса ARCHIVED");
        }

        Lot republicatedLot = lotService.republicateLot(lot);
        LotResponse lotResponse = lotMapper.mapToLotResponse(republicatedLot);
        return new BaseResponse<>(lotResponse);
    }

    @Operation(description = "Удаление фото из лота")
    @SecurityRequirement(name = "bearerAuth")
    @DeleteMapping("/{lotId}/photo/{photoId}")
    public void deletePhoto(@PathVariable("lotId") long lotId, @PathVariable("photoId") long photoId)
            throws LotPhotoNotFoundException, LotNotFoundException, UserNotFoundException {
        Lot lot = lotService.getById(lotId);
        validateOwner(lot.getUser());

        LotPhoto lotPhoto = lotPhotoService.getById(photoId);
        lotPhotoService.delete(lotPhoto);
    }

    @Operation(description = "Удаление пожелания из лота")
    @SecurityRequirement(name = "bearerAuth")
    @DeleteMapping("/{lotId}/photo/{wantId}")
    public void deleteWant(@PathVariable("lotId") long lotId, @PathVariable("wantId") long wantId)
            throws WantNotFoundException, LotNotFoundException, UserNotFoundException {
        Lot lot = lotService.getById(lotId);
        validateOwner(lot.getUser());

        Want want = wantService.getById(wantId);
        wantService.delete(want);
    }

    private void validateOwner(User owner) throws UserNotFoundException {
        String authenticatedUserEmail = authService.getAuthenticatedUserEmail();
        User user = userService.getByEmail(authenticatedUserEmail);
        if(!user.equals(owner)){
            throw new RuntimeException("Нельзя редактировать чужой лот");
        }
    }
}
