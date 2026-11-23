package com.ims.backend.modules.system;

import com.ims.backend.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
@Tag(name = "System Health", description = "Endpoints for platform heartbeat and system status")
public class HealthCheckController {

    @GetMapping
    @Operation(summary = "System Health Check", description = "Returns active health status, timestamp, and environment metadata")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkHealth() {
        Map<String, Object> statusData = Map.of(
                "status", "UP",
                "service", "ims-backend",
                "version", "1.0.0",
                "javaVersion", System.getProperty("java.version"),
                "timestamp", Instant.now()
        );
        return ResponseEntity.ok(ApiResponse.success("IMS Backend is operating normally", statusData));
    }
}
