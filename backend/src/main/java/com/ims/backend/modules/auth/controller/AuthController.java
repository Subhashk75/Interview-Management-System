package com.ims.backend.modules.auth.controller;

import com.ims.backend.common.ApiResponse;
import com.ims.backend.modules.auth.dto.*;
import com.ims.backend.modules.auth.security.UserPrincipal;
import com.ims.backend.modules.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseCookie;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;

import java.util.Arrays;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication & Account Security", description = "Endpoints for JWT login, token refresh, password resets, and user session")
public class AuthController {

    private final AuthService authService;

    @Value("${app.jwt.refresh-cookie-name:ims_refresh_token}")
    private String refreshCookieName;

    @Value("${app.jwt.refresh-expiration-ms:604800000}")
    private long refreshExpirationMs;

    @Value("${app.jwt.refresh-cookie-secure:false}")
    private boolean refreshCookieSecure;

    @PostMapping("/login")
    @Operation(summary = "User Login", description = "Authenticates user credentials and returns JWT access and refresh tokens")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return withRefreshCookie(ApiResponse.success("Login successful", response), response.getRefreshToken());
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh JWT Token", description = "Exchanges a valid refresh token for a newly signed access token")
    public ResponseEntity<ApiResponse<LoginResponse>> refreshToken(
            @CookieValue(name = "ims_refresh_token", required = false) String refreshToken
    ) {
        if (refreshToken == null) {
            throw new com.ims.backend.exception.UnauthorizedException("Refresh token is missing");
        }
        LoginResponse response = authService.refreshToken(refreshToken);
        return withRefreshCookie(ApiResponse.success("Token refreshed successfully", response), response.getRefreshToken());
    }

    @PostMapping("/change-password")
    @Operation(summary = "Mandatory / Self Change Password", description = "Changes password for current user and clears requiresPasswordChange flag")
    public ResponseEntity<ApiResponse<LoginResponse>> changePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        LoginResponse response = authService.changePassword(principal.getId(), request);
        return withRefreshCookie(ApiResponse.success("Password changed successfully", response), response.getRefreshToken());
    }

    @GetMapping("/me")
    @Operation(summary = "Get Current User Profile", description = "Returns active user identity, assigned role, and permissions")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        UserDto userDto = authService.getCurrentUser(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("User profile retrieved successfully", userDto));
    }

    @PostMapping("/logout")
    @Operation(summary = "User Logout", description = "Stateless logout confirmation")
    public ResponseEntity<ApiResponse<Void>> logout(
            @CookieValue(name = "ims_refresh_token", required = false) String refreshToken,
            HttpServletRequest request
    ) {
        authService.logout(refreshToken);
        ResponseCookie cookie = buildRefreshCookie(null, 0);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ApiResponse.message("Logged out successfully"));
    }

    private ResponseEntity<ApiResponse<LoginResponse>> withRefreshCookie(
            ApiResponse<LoginResponse> body,
            String refreshToken
    ) {
        ResponseCookie cookie = buildRefreshCookie(refreshToken, refreshExpirationMs / 1000);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(body);
    }

    private ResponseCookie buildRefreshCookie(String value, long maxAgeSeconds) {
        return ResponseCookie.from(refreshCookieName, value == null ? "" : value)
                .httpOnly(true)
                .secure(refreshCookieSecure)
                .sameSite("Lax")
                .path("/api/v1/auth")
                .maxAge(maxAgeSeconds)
                .build();
    }
}
