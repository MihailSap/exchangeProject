package ru.urfu.exchangeProject.dto.lot;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import org.springframework.web.multipart.MultipartFile;
import ru.urfu.exchangeProject.dto.lot.want.WantCreateRequest;
import ru.urfu.exchangeProject.model.lot.DeliveryMethod;
import ru.urfu.exchangeProject.model.lot.LotType;

import java.math.BigDecimal;
import java.util.List;

public record LotCreateRequest(
        @NotNull
        String title,
        String description,
        @NotNull
        @JsonProperty("category_id")
        long categoryId,
        String region,
        @NotNull
        LotType type,
        @NotNull
        @JsonProperty("delivery_method")
        DeliveryMethod deliveryMethod,
        @NotNull
        @JsonProperty("estimated_cost")
        BigDecimal estimatedCost,
        List<MultipartFile> photos,
        List<WantCreateRequest> wants
) {
}
