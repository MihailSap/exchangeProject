package ru.urfu.exchangeProject.exception.handler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import ru.urfu.exchangeProject.dto.exceptions.*;
import ru.urfu.exchangeProject.exception.customEx.news.*;
import ru.urfu.exchangeProject.exception.globalEx.InvalidException;
import ru.urfu.exchangeProject.exception.globalEx.NotFoundException;

import java.util.List;

@ControllerAdvice
public class GlobalExceptionHandler {

    private final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(EmailExistsException.class)
    public ResponseEntity<ExceptionResponse> handleEmailExistsException(EmailExistsException ex){
        logger.error("EmailExistsException");
        ExceptionErrorResponse exceptionErrorResponse = new ExceptionErrorResponse(
                ErrorCode.EMAIL_EXISTS_EXCEPTION, null, null);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ExceptionResponse(exceptionErrorResponse));
    }

    @ExceptionHandler(NameExistsException.class)
    public ResponseEntity<ExceptionResponse> handleNameExistsException(NameExistsException ex){
        logger.error("NameExistsException");
        ExceptionErrorResponse exceptionErrorResponse = new ExceptionErrorResponse(
                ErrorCode.NAME_EXISTS_EXCEPTION, null, null);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ExceptionResponse(exceptionErrorResponse));
    }

    @ExceptionHandler(SlugExistsException.class)
    public ResponseEntity<ExceptionResponse> handleSlugExistsException(SlugExistsException ex){
        logger.error("SlugExistsException");
        ExceptionErrorResponse exceptionErrorResponse = new ExceptionErrorResponse(
                ErrorCode.SLUG_EXISTS_EXCEPTION, null, null);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ExceptionResponse(exceptionErrorResponse));
    }

    @ExceptionHandler(CategoryCircularHierarchyException.class)
    public ResponseEntity<ExceptionResponse> handleSlugExistsException(CategoryCircularHierarchyException ex){
        logger.error("CategoryCircularHierarchyException");
        ExceptionErrorResponse exceptionErrorResponse = new ExceptionErrorResponse(
                ErrorCode.CATEGORY_CIRCULAR_HIERARCHY_EXCEPTION, null, null);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ExceptionResponse(exceptionErrorResponse));
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ExceptionResponse> handleInvalidCredentialsException(InvalidCredentialsException ex){
        logger.error("InvalidCredentialsException");
        ExceptionErrorResponse exceptionErrorResponse = new ExceptionErrorResponse(
                ErrorCode.INVALID_CREDENTIALS, null, null);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ExceptionResponse(exceptionErrorResponse));
    }

    @ExceptionHandler(AccountFrozenException.class)
    public ResponseEntity<ExceptionResponse> handleAccountFrozenException(AccountFrozenException ex){
        logger.error("AccountFrozenException: {}", ex.getMessage(), ex);
        ExceptionErrorResponse exceptionErrorResponse = new ExceptionErrorResponse(
                ErrorCode.ACCOUNT_FROZEN, ex.getMessage(), null);
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ExceptionResponse(exceptionErrorResponse));
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ExceptionResponse> handleNotFoundEx(NotFoundException ex) {
        logger.error("NotFoundException: {}", ex.getMessage(), ex);
        ExceptionErrorResponse exceptionErrorResponse = new ExceptionErrorResponse(
                ErrorCode.NOT_FOUND_EXCEPTION, ex.getMessage(), null);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ExceptionResponse(exceptionErrorResponse));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ExceptionResponse> handleValidationException(
            MethodArgumentNotValidException ex) {
        List<ExceptionDetails> details = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> new ExceptionDetails(
                        error.getField(),
                        "Некорректно заполнено поле %s".formatted(error.getField())
                ))
                .toList();

        ExceptionErrorResponse errorResponse = new ExceptionErrorResponse(
                ErrorCode.VALIDATION_ERROR,
                null,
                details
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ExceptionResponse(errorResponse));
    }

    @ExceptionHandler(InvalidException.class)
    public ResponseEntity<ExceptionResponse> handleInvalidException(InvalidException ex) {
        logger.error("InvalidException: {}", ex.getMessage(), ex);
        ExceptionErrorResponse exceptionErrorResponse = new ExceptionErrorResponse(
                ErrorCode.INVALID_EXCEPTION, ex.getMessage(), null);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ExceptionResponse(exceptionErrorResponse));
    }

    @ExceptionHandler(TokenExpiredException.class)
    public ResponseEntity<ExceptionResponse> handleTokenExpiredException(TokenExpiredException ex) {
        logger.error("TokenExpiredException");
        ExceptionErrorResponse exceptionErrorResponse = new ExceptionErrorResponse(
                ErrorCode.TOKEN_EXPIRED, null, null);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ExceptionResponse(exceptionErrorResponse));
    }

    @ExceptionHandler(TokenInvalidException.class)
    public ResponseEntity<ExceptionResponse> handleTokenInvalidException(TokenInvalidException ex) {
        logger.error("TokenInvalidException");
        ExceptionErrorResponse exceptionErrorResponse = new ExceptionErrorResponse(
                ErrorCode.TOKEN_INVALID, null, null);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ExceptionResponse(exceptionErrorResponse));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ExceptionResponse> handleException(Exception ex) {
        logger.error("Exception: {}", ex.getMessage(), ex);
        ExceptionErrorResponse exceptionErrorResponse = new ExceptionErrorResponse(
                ErrorCode.UNKNOWN_EXCEPTION, ex.getMessage(), null);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ExceptionResponse(exceptionErrorResponse));
    }
}