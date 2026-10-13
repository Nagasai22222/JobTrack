package com.jobtrack.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // -------------------------------------------------------------------------
    // 404 – application / resource not found
    // -------------------------------------------------------------------------

    @ExceptionHandler(JobApplicationNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, Object> handleJobApplicationNotFoundException(
            JobApplicationNotFoundException ex, HttpServletRequest request) {
        return errorBody(404, "Not Found", ex.getMessage(), request);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, Object> handleResourceNotFoundException(
            ResourceNotFoundException ex, HttpServletRequest request) {
        return errorBody(404, "Not Found", ex.getMessage(), request);
    }

    // -------------------------------------------------------------------------
    // 400 – @Valid bean validation failures (request body)
    // -------------------------------------------------------------------------

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleValidationExceptions(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        String errors = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));
        return errorBody(400, "Bad Request", "Validation failed: " + errors, request);
    }

    // -------------------------------------------------------------------------
    // 400 – invalid query parameter type (e.g. bad enum or bad date format)
    // -------------------------------------------------------------------------

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        String paramName = ex.getName();
        String value = ex.getValue() != null ? ex.getValue().toString() : "null";

        Class<?> required = ex.getRequiredType();
        String message;

        if (required != null && required.isEnum()) {
            Object[] constants = required.getEnumConstants();
            String validValues = Arrays.stream(constants)
                    .map(Object::toString)
                    .collect(Collectors.joining(", "));
            message = "Invalid value '" + value + "' for parameter '" + paramName
                    + "'. Allowed values: " + validValues;
        } else {
            message = "Invalid value '" + value + "' for parameter '" + paramName
                    + "'. Expected type: " + (required != null ? required.getSimpleName() : "unknown");
        }

        return errorBody(400, "Bad Request", message, request);
    }

    // -------------------------------------------------------------------------
    // 400 – invalid JSON body
    // -------------------------------------------------------------------------

    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex, HttpServletRequest request) {
        String msg = ex.getMessage();
        if (msg != null && msg.contains("Cannot deserialize value of type")) {
            return errorBody(400, "Bad Request",
                    "Invalid value in request body. "
                    + "Check enum fields – valid statuses: APPLIED, SCREENING, INTERVIEW, OFFER, REJECTED, WITHDRAWN", request);
        }
        return errorBody(400, "Bad Request", "Malformed request body", request);
    }

    // -------------------------------------------------------------------------
    // 400 – explicit IllegalArgumentException from service layer
    // -------------------------------------------------------------------------

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleIllegalArgumentException(
            IllegalArgumentException ex, HttpServletRequest request) {
        return errorBody(400, "Bad Request", ex.getMessage(), request);
    }

    // -------------------------------------------------------------------------
    // 400 – oversized file upload
    // -------------------------------------------------------------------------

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleMaxUploadSizeExceeded(
            MaxUploadSizeExceededException ex, HttpServletRequest request) {
        return errorBody(400, "Bad Request", "File size exceeds maximum allowed limit of 5 MB", request);
    }

    // -------------------------------------------------------------------------
    // 401 – bad credentials
    // -------------------------------------------------------------------------

    @ExceptionHandler(BadCredentialsException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public Map<String, Object> handleBadCredentialsException(
            BadCredentialsException ex, HttpServletRequest request) {
        return errorBody(401, "Unauthorized", "Invalid username or password", request);
    }

    // -------------------------------------------------------------------------
    // 403 – access denied / ownership violation
    // -------------------------------------------------------------------------

    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public Map<String, Object> handleAccessDeniedException(
            AccessDeniedException ex, HttpServletRequest request) {
        return errorBody(403, "Forbidden", "Access Denied", request);
    }

    // -------------------------------------------------------------------------
    // 500 – unexpected internal server error fallback (masks stack traces)
    // -------------------------------------------------------------------------

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Map<String, Object> handleGeneralException(
            Exception ex, HttpServletRequest request) {
        return errorBody(500, "Internal Server Error", "An unexpected error occurred", request);
    }

    // -------------------------------------------------------------------------
    // Helper
    // -------------------------------------------------------------------------

    private Map<String, Object> errorBody(int status, String error, String message, HttpServletRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", status);
        body.put("error", error);
        body.put("message", message);
        body.put("path", request != null ? request.getRequestURI() : "");
        return body;
    }
}
