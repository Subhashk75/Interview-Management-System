package com.ims.backend.modules.auth;

import com.ims.backend.modules.auth.dto.ChangePasswordRequest;
import com.ims.backend.modules.auth.dto.LoginRequest;
import com.ims.backend.modules.auth.dto.LoginResponse;
import com.ims.backend.modules.auth.service.AuthService;
import com.ims.backend.modules.users.entity.User;
import com.ims.backend.modules.users.entity.UserRole;
import com.ims.backend.modules.users.entity.UserStatus;
import com.ims.backend.modules.users.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {
    "spring.data.mongodb.uri=mongodb://localhost:27017/ims_test_db"
})
class AuthServiceTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User testUser;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        testUser = User.builder()
                .email("test.hr@ims.internal")
                .passwordHash(passwordEncoder.encode("TempSecret123!"))
                .firstName("Test")
                .lastName("Recruiter")
                .role(UserRole.ROLE_HR)
                .status(UserStatus.ACTIVE)
                .requiresPasswordChange(true)
                .build();

        testUser = userRepository.save(testUser);
    }

    @Test
    void testLoginSuccess_ReturnsTokensAndPreservesFlag() {
        LoginRequest request = LoginRequest.builder()
                .email("test.hr@ims.internal")
                .password("TempSecret123!")
                .build();

        LoginResponse response = authService.login(request);

        assertNotNull(response.getAccessToken());
        assertNotNull(response.getRefreshToken());
        assertEquals("test.hr@ims.internal", response.getUser().getEmail());
        assertTrue(response.getUser().isRequiresPasswordChange());
    }

    @Test
    void testLoginFailure_InvalidPasswordThrowsException() {
        LoginRequest request = LoginRequest.builder()
                .email("test.hr@ims.internal")
                .password("WrongPassword999!")
                .build();

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }

    @Test
    void testChangePasswordSuccess_ClearsFlag() {
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("TempSecret123!")
                .newPassword("NewBrandSecret456!")
                .confirmPassword("NewBrandSecret456!")
                .build();

        LoginResponse response = authService.changePassword(testUser.getId(), request);

        assertFalse(response.getUser().isRequiresPasswordChange());

        User updatedUser = userRepository.findById(testUser.getId()).orElseThrow();
        assertFalse(updatedUser.isRequiresPasswordChange());
        assertTrue(passwordEncoder.matches("NewBrandSecret456!", updatedUser.getPasswordHash()));
    }
}
