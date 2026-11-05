package ru.urfu.exchangeProject.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import ru.urfu.exchangeProject.PathsConstants;
import ru.urfu.exchangeProject.dto.BaseResponse;
import ru.urfu.exchangeProject.dto.lot.LotCreateRequest;
import ru.urfu.exchangeProject.dto.lot.LotListResponse;
import ru.urfu.exchangeProject.dto.lot.LotResponse;
import ru.urfu.exchangeProject.dto.lot.LotUpdateRequest;
import ru.urfu.exchangeProject.exception.customEx.UserNotFoundException;
import ru.urfu.exchangeProject.exception.customEx.news.*;
import ru.urfu.exchangeProject.mapper.LotMapper;
import ru.urfu.exchangeProject.model.lot.*;
import ru.urfu.exchangeProject.model.lot.want.Want;
import ru.urfu.exchangeProject.model.user.User;
import ru.urfu.exchangeProject.model.user.UserStatus;
import ru.urfu.exchangeProject.service.*;

import java.math.BigDecimal;
import java.util.List;

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
    public BaseResponse<LotResponse> getById(@PathVariable("id") long id) throws LotNotFoundException, UserNotFoundException {
        Lot lot = lotService.getById(id);
        LotStatus lotStatus = lot.getStatus();
        if(lotStatus == LotStatus.ARCHIVED || lotStatus == LotStatus.DRAFT || lotStatus == LotStatus.DELETED
                || lotStatus == LotStatus.MODERATION || lotStatus == LotStatus.REJECTED){
            try{
                String authenticatedUserEmail = authService.getAuthenticatedUserEmail();
                User user = userService.getByEmail(authenticatedUserEmail);
                validateOwner(user, lot.getUser());
            } catch (Exception e){
                throw new LotForbiddenException();
            }
        }

        User lotOwner = lot.getUser();
        if(lotOwner.getStatus() == UserStatus.FROZEN){
            String authenticatedUserEmail = authService.getAuthenticatedUserEmail();
            User user = userService.getByEmail(authenticatedUserEmail);
            validateOwner(user, lotOwner);
        }

        LotResponse lotResponse = lotMapper.mapToLotResponse(lot);
        return new BaseResponse<>(lotResponse);
    }

    @Operation(description = "Список или поиск активных лотов")
    @GetMapping
    public LotListResponse searchLots(
            @RequestParam(required = false) String q,
            @RequestParam(name = "category_id", required = false)
            @Positive Long categoryId,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) LotType type,
            @RequestParam(defaultValue = "false") boolean delivery,
            @RequestParam(defaultValue = "false") boolean pickup,
            @RequestParam(name = "min_cost", required = false)
            BigDecimal minCost,
            @RequestParam(name = "max_cost", required = false)
            BigDecimal maxCost,
            @RequestParam(defaultValue = "date_desc") String sort,
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(name = "per_page", defaultValue = "20")
            @Min(1) @Max(100) int perPage
    ) throws CategoryNotFound {

        Page<Lot> lotPage = lotService.searchLots(
                q,
                categoryId,
                region,
                type,
                delivery,
                pickup,
                minCost,
                maxCost,
                sort,
                page,
                perPage
        );

        List<LotResponse> lotResponses = lotPage
                .map(lotMapper::mapToLotResponse)
                .getContent();

        return new LotListResponse(
                lotResponses,
                new LotListResponse.Meta(
                        page,
                        perPage,
                        lotPage.getTotalElements()
                )
        );
    }

    @Operation(description = "Создание лота")
    @SecurityRequirement(name = "bearerAuth")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public BaseResponse<LotResponse> create(@Valid @ModelAttribute LotCreateRequest lotCreateRequest)
            throws UserNotFoundException, CategoryNotFound {
        String authenticatedUserEmail = authService.getAuthenticatedUserEmail();
        User user = userService.getByEmail(authenticatedUserEmail);
        validateUser(user);

        String region;
        String requestRegion = lotCreateRequest.region();
        if(requestRegion != null && !requestRegion.isBlank()){
            region = requestRegion;
        } else {
            region = user.getRegion();
        }

        int lotPhotoCount = lotCreateRequest.photos().size();
        if(lotPhotoCount < 1 || lotPhotoCount > 10 || lotCreateRequest.wants().isEmpty()){
            throw new BadRequestException();
        }

        Lot lot = lotService.create(lotCreateRequest, region, user);
        LotResponse lotResponse = lotMapper.mapToLotResponse(lot);
        return new BaseResponse<>(lotResponse);
    }

    @Operation(description = "Обновление лота")
    @SecurityRequirement(name = "bearerAuth")
    @PatchMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public BaseResponse<LotResponse> update(
            @PathVariable("id") long id, @Valid @ModelAttribute LotUpdateRequest lotUpdateRequest)
            throws UserNotFoundException, CategoryNotFound, LotNotFoundException {
        String authenticatedUserEmail = authService.getAuthenticatedUserEmail();
        User user = userService.getByEmail(authenticatedUserEmail);
        validateUser(user);

        Lot lot = lotService.getById(id);
        validateOwner(user, lot.getUser());

        if(LotStatus.IN_EXCHANGE.equals(lot.getStatus()) || LotStatus.COMPLETED.equals(lot.getStatus())){
            throw new LotConflictException();
        }

        if(lot.getLotPhotoDataList().size() + lotUpdateRequest.photos().size() > 10){
            throw new BadRequestException();
        }

        Lot updatedLot = lotService.update(lotUpdateRequest, lot);
        LotResponse lotResponse = lotMapper.mapToLotResponse(updatedLot);
        return new BaseResponse<>(lotResponse);
    }

    @Operation(description = "Мягкое удаление лота")
    @SecurityRequirement(name = "bearerAuth")
    @DeleteMapping("/{lotId}")
    public void softDelete(@PathVariable("lotId") long lotId) throws LotNotFoundException, UserNotFoundException {
        String authenticatedUserEmail = authService.getAuthenticatedUserEmail();
        User user = userService.getByEmail(authenticatedUserEmail);
        validateUser(user);

        Lot lot = lotService.getById(lotId);
        validateOwner(user, lot.getUser());
        lotService.softDelete(lot);
    }

    @Operation(description = "Перепубликация архивного лота")
    @PatchMapping("/{lotId}/republicate")
    public BaseResponse<LotResponse> republicateLot(@PathVariable("lotId") long lotId)
            throws LotNotFoundException, UserNotFoundException {
        String authenticatedUserEmail = authService.getAuthenticatedUserEmail();
        User user = userService.getByEmail(authenticatedUserEmail);
        validateUser(user);

        Lot lot = lotService.getById(lotId);
        validateOwner(user, lot.getUser());

        if(!LotStatus.ARCHIVED.equals(lot.getStatus())){
            throw new LotConflictException();
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
        String authenticatedUserEmail = authService.getAuthenticatedUserEmail();
        User user = userService.getByEmail(authenticatedUserEmail);
        validateUser(user);

        Lot lot = lotService.getById(lotId);
        validateOwner(user, lot.getUser());

        LotPhoto lotPhoto = lotPhotoService.getById(photoId);
        if(!lot.equals(lotPhoto.getLot()) || lot.getLotPhotoDataList().size() <= 1
                || lot.getStatus() == LotStatus.IN_EXCHANGE || lot.getStatus() == LotStatus.COMPLETED){
            throw new LotConflictException();
        }
        lotPhotoService.delete(lotPhoto);
    }

    @Operation(description = "Удаление пожелания из лота")
    @SecurityRequirement(name = "bearerAuth")
    @DeleteMapping("/{lotId}/want/{wantId}")
    public void deleteWant(@PathVariable("lotId") long lotId, @PathVariable("wantId") long wantId)
            throws WantNotFoundException, LotNotFoundException, UserNotFoundException {
        String authenticatedUserEmail = authService.getAuthenticatedUserEmail();
        User user = userService.getByEmail(authenticatedUserEmail);
        validateUser(user);

        Lot lot = lotService.getById(lotId);
        validateOwner(user, lot.getUser());

        Want want = wantService.getById(wantId);
        if(!lot.equals(want.getLot()) || lot.getWants().size() <= 1
                || lot.getStatus() == LotStatus.IN_EXCHANGE || lot.getStatus() == LotStatus.COMPLETED){
            throw new LotConflictException();
        }
        wantService.delete(want);
    }

    private void validateOwner(User authenticatedUser, User owner) {
        if(!authenticatedUser.equals(owner)){
            throw new LotForbiddenException();
        }
    }

    private void validateUser(User user) {
        if(UserStatus.FROZEN.equals(user.getStatus())){
            throw new AccountFrozenException(user.getFrozenReason());
        }
        if(!user.isEmailConfirmed()){
            throw new EmailNotConfirmedException();
        }
    }
}
