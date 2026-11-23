package com.ims.backend.modules.users.controller;

import com.ims.backend.common.PageResponse;
import com.ims.backend.common.ApiResponse;
import com.ims.backend.modules.auth.dto.UserDto;
import com.ims.backend.modules.auth.security.UserPrincipal;
import com.ims.backend.modules.users.dto.*;
import com.ims.backend.modules.users.entity.UserRole;
import com.ims.backend.modules.users.entity.UserStatus;
import com.ims.backend.modules.users.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "User Management", description = "Endpoints for managing users, roles, statuses, and interviewer directories")
@SecurityRequirement(name = "Bearer Authentication")
public class UserController {

    private final UserService userService;

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Provision a new internal user (HR, Interviewer, Hiring Manager, Admin) with temporary password")
    public ResponseEntity<ApiResponse<CreatedUserResponse>> createUser(
            @Valid @RequestBody CreateUserRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        log.info("Admin {} creating new user with email: {}", principal.getUsername(), request.getEmail());
        CreatedUserResponse createdUser = userService.createUser(request, principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User created successfully with temporary password", createdUser));
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_HR')")
    @Operation(summary = "List users with pagination, text search, and role/status/department filtering")
    public ResponseEntity<ApiResponse<PageResponse<UserDto>>> listUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) String department,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Sort sort = "asc".equalsIgnoreCase(direction) ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        PageResponse<UserDto> response = userService.getUsers(search, role, department, status, pageable);
        return ResponseEntity.ok(ApiResponse.success("Users retrieved successfully", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_HR') or #principal.id == #id")
    @Operation(summary = "Get user profile details by ID")
    public ResponseEntity<ApiResponse<UserDto>> getUserById(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        UserDto userDto = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success("User profile retrieved successfully", userDto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Update user details (roles, profile, department, skills)")
    public ResponseEntity<ApiResponse<UserDto>> updateUser(
            @PathVariable String id,
            @Valid @RequestBody UpdateUserRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        UserDto updated = userService.updateUser(id, request, principal);
        return ResponseEntity.ok(ApiResponse.success("User profile updated successfully", updated));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Activate, deactivate, or lock a user account")
    public ResponseEntity<ApiResponse<UserDto>> updateUserStatus(
            @PathVariable String id,
            @Valid @RequestBody UpdateUserStatusRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        UserDto updated = userService.updateUserStatus(id, request.getStatus(), principal);
        return ResponseEntity.ok(ApiResponse.success("User status updated to " + request.getStatus(), updated));
    }

    @GetMapping("/interviewers")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_HR', 'ROLE_HIRING_MANAGER')")
    @Operation(summary = "Fetch directory of active interviewers, filterable by department and skill tag")
    public ResponseEntity<ApiResponse<List<InterviewerSummaryDto>>> getInterviewers(
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String skill
    ) {
        List<InterviewerSummaryDto> interviewers = userService.getInterviewers(department, skill);
        return ResponseEntity.ok(ApiResponse.success("Interviewer directory retrieved successfully", interviewers));
    }

    @GetMapping("/metrics")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Operation(summary = "Get user distribution and status breakdown metrics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUserMetrics() {
        Map<String, Object> metrics = userService.getUserMetrics();
        return ResponseEntity.ok(ApiResponse.success("User metrics retrieved successfully", metrics));
    }
}
