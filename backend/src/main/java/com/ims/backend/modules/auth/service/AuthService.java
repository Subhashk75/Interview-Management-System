package com.ims.backend.modules.auth.service;

import com.ims.backend.exception.BadRequestException;
import com.ims.backend.exception.ResourceNotFoundException;
import com.ims.backend.exception.UnauthorizedException;
import com.ims.backend.modules.auth.dto.*;
import com.ims.backend.modules.auth.mapper.UserMapper;
import com.ims.backend.modules.users.entity.User;
import com.ims.backend.modules.users.entity.UserStatus;
import com.ims.backend.modules.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserMapper userMapper;
    private final RefreshSessionService refreshSessionService;

    @Transactional
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            log.warn("Failed login attempt for email: {}", request.getEmail());
            throw new BadCredentialsException("Invalid email or password");
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            log.warn("Login attempt for non-active user: {} (Status: {})", user.getEmail(), user.getStatus());
            throw new UnauthorizedException("Your account is " + user.getStatus().name().toLowerCase() + ". Please contact administrator.");
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = refreshSessionService.createRefreshSession(user, jwtService);

        log.info("User logged in successfully: {} (Role: {})", user.getEmail(), user.getRole());

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getAccessExpirationMs() / 1000)
                .user(userMapper.toDto(user))
                .build();
    }

    public LoginResponse refreshToken(String token) {
        if (!jwtService.validateToken(token) || !jwtService.isRefreshToken(token)) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        String userId = jwtService.extractUserId(token);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new UnauthorizedException("Account is not active");
        }

        RefreshSessionService.RefreshRotation rotation =
                refreshSessionService.rotateRefreshSession(token, jwtService, user);

        return LoginResponse.builder()
                .accessToken(rotation.accessToken())
                .refreshToken(rotation.refreshToken())
                .tokenType("Bearer")
                .expiresIn(jwtService.getAccessExpirationMs() / 1000)
                .user(userMapper.toDto(user))
                .build();
    }

    public void logout(String refreshToken) {
        if (refreshToken == null) {
            return;
        }
        try {
            if (jwtService.validateToken(refreshToken) && jwtService.isRefreshToken(refreshToken)) {
                refreshSessionService.revokeSession(jwtService.extractSessionId(refreshToken));
            }
        } catch (Exception ex) {
            log.debug("Unable to revoke refresh session during logout", ex);
        }
    }

    @Transactional
    public LoginResponse changePassword(String userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password does not match records");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("New password and confirm password do not match");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new BadRequestException("New password cannot be identical to the current password");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setRequiresPasswordChange(false);
        userRepository.save(user);

        log.info("Password changed successfully for user: {}", user.getEmail());

        refreshSessionService.revokeAllForUser(userId);
        String newAccessToken = jwtService.generateAccessToken(user);
        String newRefreshToken = refreshSessionService.createRefreshSession(user, jwtService);

        return LoginResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getAccessExpirationMs() / 1000)
                .user(userMapper.toDto(user))
                .build();
    }

    public UserDto getCurrentUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        return userMapper.toDto(user);
    }
}
