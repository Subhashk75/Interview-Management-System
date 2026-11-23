package com.ims.backend.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiErrorResponse {

    @Builder.Default
    private boolean success = false;

    private String errorCode;

    private String message;

    private List<ValidationError> errors;

    @Builder.Default
    private Instant timestamp = Instant.now();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ValidationError {
        private String field;
        private Object rejectedValue;
        private String reason;
    }

    public static ApiErrorResponse of(String errorCode, String message) {
        return ApiErrorResponse.builder()
                .success(false)
                .errorCode(errorCode)
                .message(message)
                .timestamp(Instant.now())
                .build();
    }

    public static ApiErrorResponse of(String errorCode, String message, List<ValidationError> errors) {
        return ApiErrorResponse.builder()
                .success(false)
                .errorCode(errorCode)
                .message(message)
                .errors(errors)
                .timestamp(Instant.now())
                .build();
    }
}
