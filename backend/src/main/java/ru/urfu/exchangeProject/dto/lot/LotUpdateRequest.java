package ru.urfu.exchangeProject.dto.lot;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.web.multipart.MultipartFile;
import ru.urfu.exchangeProject.dto.lot.want.WantCreateRequest;
import ru.urfu.exchangeProject.model.lot.DeliveryMethod;
import ru.urfu.exchangeProject.model.lot.LotType;

import java.math.BigDecimal;
import java.util.List;

public record LotUpdateRequest(
        String title,
        String description,
        @JsonProperty("category_id")
        Long categoryId,
        String region,
        LotType type,
        @JsonProperty("delivery_method")
        DeliveryMethod deliveryMethod,
        @JsonProperty("estimated_cost")
        BigDecimal estimatedCost,
        List<MultipartFile> photos,
        List<WantCreateRequest> wants
) {
}
