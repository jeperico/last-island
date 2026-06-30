package com.last_island.api.common.exceptions;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatusException(ResponseStatusException ex) {
        Map<String, Object> body = Map.of(
                "status", ex.getStatusCode().value(),
                "error", ex.getStatusCode().toString(),
                "message", ex.getReason() != null ? ex.getReason() : "Unexpected error",
                "timestamp", LocalDateTime.now().toString()
        );
        return ResponseEntity.status(ex.getStatusCode()).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        Map<String, Object> body = Map.of(
                "status", 500,
                "error", "Internal Server Error",
                "message", ex.getMessage() != null ? ex.getMessage() : "Unexpected error",
                "timestamp", LocalDateTime.now().toString()
        );
        return ResponseEntity.internalServerError().body(body);
    }
}
