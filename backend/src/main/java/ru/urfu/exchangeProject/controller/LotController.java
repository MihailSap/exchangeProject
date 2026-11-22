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
import org.springframework.web.multipart.MultipartFile;
import ru.urfu.exchangeProject.PathsConstants;
import ru.urfu.exchangeProject.dto.BaseResponse;
import ru.urfu.exchangeProject.dto.exceptions.ErrorCode;
import ru.urfu.exchangeProject.dto.lot.LotCreateRequest;
import ru.urfu.exchangeProject.dto.lot.LotListResponse;
import ru.urfu.exchangeProject.dto.lot.LotResponse;
import ru.urfu.exchangeProject.dto.lot.LotUpdateRequest;
import ru.urfu.exchangeProject.dto.lot.want.WantCreateRequest;
import ru.urfu.exchangeProject.exception.customEx.UserNotFoundException;
import ru.urfu.exchangeProject.exception.customEx.news.*;
import ru.urfu.exchangeProject.exception.globalEx.UnauthorizedException;
import ru.urfu.exchangeProject.mapper.LotMapper;
import ru.urfu.exchangeProject.model.lot.*;
import ru.urfu.exchangeProject.model.lot.want.Want;
import ru.urfu.exchangeProject.model.user.User;
import ru.urfu.exchangeProject.model.user.UserStatus;
import ru.urfu.exchangeProject.service.*;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Tag(name = "Лоты")
@RestController
@RequestMapping(PathsConstants.ROOT + PathsConstants.LOTS)
public class LotController {

    private final AuthService authService;
    private final LotService lotService;
    private final WantService wantService;
    private final LotPhotoService lotPhotoService;
    private final LotMapper lotMapper;

    @Autowired
    public LotController(
            AuthService authService,
            LotService lotService,
            WantService wantService,
            LotPhotoService lotPhotoService,
            LotMapper lotMapper
    ) {
        this.authService = authService;
        this.lotService = lotService;
        this.wantService = wantService;
        this.lotPhotoService = lotPhotoService;
        this.lotMapper = lotMapper;
    }

    @Operation(description = "Получение лота по id")
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/{id}")
    public BaseResponse<LotResponse> getById(@PathVariable("id") long id) throws LotNotFoundException, UserNotFoundException {
        Lot lot = lotService.getById(id);
        LotStatus lotStatus = lot.getStatus();
        if(lotStatus == LotStatus.ARCHIVED || lotStatus == LotStatus.DRAFT || lotStatus == LotStatus.DELETED
                || lotStatus == LotStatus.MODERATION || lotStatus == LotStatus.REJECTED){
            User user = authService.getAuthenticatedUser();
            validateOwner(user, lot.getUser());
        }

        User lotOwner = lot.getUser();
        if(lotOwner.getStatus() == UserStatus.FROZEN){
            User user = authService.getAuthenticatedUser();
            validateOwner(user, lotOwner);
        }

        if(lotStatus == LotStatus.IN_EXCHANGE){
            User authenticatedUser = authService.getAuthenticatedUser();
            //TODO: Доделать
        }

        LotResponse lotResponse = lotMapper.mapToLotResponse(lot);
        return new BaseResponse<>(lotResponse);
    }

    @Operation(description = "Список или поиск лотов")
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping
    public LotListResponse searchLots(
            @RequestParam(required = false) String q,
            @RequestParam(name = "category_id", required = false)
            @Positive Long categoryId,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) LotType type,
            @RequestParam(defaultValue = "false") boolean delivery,
            @RequestParam(defaultValue = "false") boolean pickup,
            @RequestParam(name = "by_user", required = false)
            @Positive Long byUser,
            @RequestParam(required = false) String status,
            @RequestParam(name = "min_cost", required = false)
            BigDecimal minCost,
            @RequestParam(name = "max_cost", required = false)
            BigDecimal maxCost,
            @RequestParam(defaultValue = "date_desc") String sort,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(name = "per_page", defaultValue = "20")
            int perPage
    ) throws CategoryNotFound {
        List<LotStatus> statuses = parseStatuses(status);
        Page<Lot> lotPage = lotService.searchLots(
                q,
                categoryId,
                region,
                type,
                delivery,
                pickup,
                byUser,
                statuses,
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

    private List<LotStatus> parseStatuses(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }

        try {
            return Arrays.stream(status.split("\\|", -1))
                    .map(String::trim)
                    .map(value -> LotStatus.valueOf(value.toUpperCase(Locale.ROOT)))
                    .distinct()
                    .toList();
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException();
        }
    }

    @Operation(description = "Создание лота")
    @SecurityRequirement(name = "bearerAuth")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public BaseResponse<LotResponse> create(@Valid @ModelAttribute LotCreateRequest lotCreateRequest)
            throws UserNotFoundException, CategoryNotFound {
        User user = authService.getAuthenticatedUser();
        validateUser(user);

        String region;
        String requestRegion = lotCreateRequest.region();
        if(requestRegion != null && !requestRegion.isBlank()){
            region = requestRegion;
        } else {
            region = user.getRegion();
        }

        List<MultipartFile> lotCreateRequestPhotos = lotCreateRequest.photos();
        List<WantCreateRequest> lotCreateRequestWants = lotCreateRequest.wants();
        if(lotCreateRequestPhotos != null && lotCreateRequestWants != null){
            int lotPhotoCount = lotCreateRequestPhotos.size();
            if(lotPhotoCount < 1 || lotPhotoCount > 10 || lotCreateRequestWants.isEmpty()){
                throw new BadRequestException();
            }
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
        User user = authService.getAuthenticatedUser();
        validateUser(user);

        Lot lot = lotService.getById(id);
        validateOwner(user, lot.getUser());

        if(LotStatus.IN_EXCHANGE.equals(lot.getStatus()) || LotStatus.COMPLETED.equals(lot.getStatus())){
            throw new LotConflictException();
        }

        List<MultipartFile> lotUpdateRequestPhotos = lotUpdateRequest.photos();
        List<LotPhoto> lotPhotoDataList = lot.getLotPhotoDataList();
        if(lotUpdateRequestPhotos != null && lotPhotoDataList != null
                && (lotPhotoDataList.size() + lotUpdateRequestPhotos.size() > 10)){
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
        User user = authService.getAuthenticatedUser();
        validateUser(user);

        Lot lot = lotService.getById(lotId);
        validateOwner(user, lot.getUser());
        lotService.softDelete(lot);
    }

    @Operation(description = "Перепубликация архивного лота")
    @PatchMapping("/{lotId}/republicate")
    public BaseResponse<LotResponse> republicateLot(@PathVariable("lotId") long lotId)
            throws LotNotFoundException, UserNotFoundException {
        User user = authService.getAuthenticatedUser();
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
        User user = authService.getAuthenticatedUser();
        validateUser(user);

        Lot lot = lotService.getById(lotId);
        validateOwner(user, lot.getUser());

        LotPhoto lotPhoto = lotPhotoService.getById(photoId);
        if(!lot.equals(lotPhoto.getLot()) || lot.getLotPhotoDataList().size() <= 1
                || lot.getStatus() == LotStatus.IN_EXCHANGE || lot.getStatus() == LotStatus.COMPLETED){
            throw new LotConflictException();
        }
        lotPhotoService.delete(lotPhoto);
        lotService.updateToModeration(lot);
    }

    @Operation(description = "Удаление пожелания из лота")
    @SecurityRequirement(name = "bearerAuth")
    @DeleteMapping("/{lotId}/want/{wantId}")
    public void deleteWant(@PathVariable("lotId") long lotId, @PathVariable("wantId") long wantId)
            throws WantNotFoundException, LotNotFoundException, UserNotFoundException {
        User user = authService.getAuthenticatedUser();
        validateUser(user);

        Lot lot = lotService.getById(lotId);
        validateOwner(user, lot.getUser());

        Want want = wantService.getById(wantId);
        if(!lot.equals(want.getLot()) || lot.getWants().size() <= 1
                || lot.getStatus() == LotStatus.IN_EXCHANGE || lot.getStatus() == LotStatus.COMPLETED){
            throw new LotConflictException();
        }
        wantService.delete(want);
        lotService.updateToModeration(lot);
    }

    private void validateOwner(User authenticatedUser, User owner) {
        if(!authenticatedUser.equals(owner)) {
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
