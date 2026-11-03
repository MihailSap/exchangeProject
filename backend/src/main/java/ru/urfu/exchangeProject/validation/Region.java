package ru.urfu.exchangeProject.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Documented
@Constraint(validatedBy = RegionValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface Region {
    String message() default "Пароль должен содержать минимум 8 символов, включая цифры и буквы";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
