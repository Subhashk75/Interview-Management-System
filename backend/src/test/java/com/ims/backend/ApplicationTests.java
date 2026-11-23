package com.ims.backend;

import com.ims.backend.modules.system.HealthCheckController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {
    "spring.data.mongodb.uri=mongodb://localhost:27017/ims_test_db"
})
class ApplicationTests {

    @Autowired(required = false)
    private HealthCheckController healthCheckController;

    @Test
    void contextLoads() {
        assertNotNull(healthCheckController, "HealthCheckController bean should be loaded");
    }

    @Test
    void healthCheckReturnsUp() {
        ResponseEntity<?> response = healthCheckController.checkHealth();
        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
    }
}
