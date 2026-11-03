package ru.urfu.exchangeProject.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import ru.urfu.exchangeProject.service.impl.RegionsProperties;

import java.util.List;

@Component
public class RegionValidator implements ConstraintValidator<Region, String> {

    private final RegionsProperties regionsProperties;
    private final List<String> regions;

    @Autowired
    public RegionValidator(RegionsProperties regionsProperties) {
        this.regionsProperties = regionsProperties;
        this.regions = regionsProperties.getRegions();
    }

    @Override
    public boolean isValid(String s, ConstraintValidatorContext constraintValidatorContext) {
        return s == null || regions.contains(s);
    }
}
