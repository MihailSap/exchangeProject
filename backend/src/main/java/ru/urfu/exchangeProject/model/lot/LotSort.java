package ru.urfu.exchangeProject.model.lot;

import org.springframework.data.domain.Sort;

import java.util.Arrays;

public enum LotSort {

    DATE_DESC("date_desc"),
    DATE_ASC("date_asc"),
    COST_ASC("cost_asc"),
    COST_DESC("cost_desc");

    private final String value;

    LotSort(String value) {
        this.value = value;
    }

    public static LotSort fromValue(String value) {
        if (value == null || value.isBlank()) {
            return DATE_DESC;
        }

        return Arrays.stream(values())
                .filter(sort -> sort.value.equalsIgnoreCase(value.trim()))
                .findFirst()
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Недопустимое значение параметра sort"
                        )
                );
    }

    public Sort toSort() {
        return switch (this) {
            case DATE_DESC -> Sort.by(
                    Sort.Order.desc("publishedAt"),
                    Sort.Order.desc("id")
            );

            case DATE_ASC -> Sort.by(
                    Sort.Order.asc("publishedAt"),
                    Sort.Order.asc("id")
            );

            case COST_ASC -> Sort.by(
                    Sort.Order.asc("estimatedCost").nullsLast(),
                    Sort.Order.desc("id")
            );

            case COST_DESC -> Sort.by(
                    Sort.Order.desc("estimatedCost").nullsLast(),
                    Sort.Order.desc("id")
            );
        };
    }
}