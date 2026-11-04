package ru.urfu.exchangeProject.dto.lot;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.bind.annotation.BindParam;
import org.springframework.web.multipart.MultipartFile;
import ru.urfu.exchangeProject.dto.lot.want.WantCreateRequest;
import ru.urfu.exchangeProject.model.lot.DeliveryMethod;
import ru.urfu.exchangeProject.model.lot.LotType;
import ru.urfu.exchangeProject.validation.Region;

import java.math.BigDecimal;
import java.util.List;

public record LotCreateRequest(
        @NotNull
        String title,
        String description,
        @NotNull
        @BindParam("category_id")
        @JsonProperty("category_id")
        Long categoryId,
        @Region
        String region,
        @NotNull
        LotType type,
        @NotNull
        @BindParam("delivery_method")
        @JsonProperty("delivery_method")
        DeliveryMethod deliveryMethod,
        @NotNull
        @BindParam("estimated_cost")
        @JsonProperty("estimated_cost")
        BigDecimal estimatedCost,
        List<MultipartFile> photos,
        List<WantCreateRequest> wants
) {
}
