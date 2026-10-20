package ru.urfu.exchangeProject.mapper;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;
import ru.urfu.exchangeProject.dto.PagedResponse;

@Component
public class PageMapper {

    public <T> PagedResponse<T> mapToPagedResponse(Page<T> page) {
        return new PagedResponse<>(
                page.getContent(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.getNumber(),
                page.getSize()
        );
    }
}
