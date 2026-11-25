package com.ims.backend.modules.users.service;

import com.ims.backend.common.PageResponse;
import com.ims.backend.exception.BadRequestException;
import com.ims.backend.exception.ResourceNotFoundException;
import com.ims.backend.modules.audit.service.AuditService;
import com.ims.backend.modules.auth.dto.UserDto;
import com.ims.backend.modules.auth.mapper.UserMapper;
import com.ims.backend.modules.auth.security.UserPrincipal;
import com.ims.backend.modules.users.dto.*;
import com.ims.backend.modules.users.entity.User;
import com.ims.backend.modules.users.entity.UserRole;
import com.ims.backend.modules.users.entity.UserStatus;
import com.ims.backend.modules.users.repository.UserRepository;
import com.ims.backend.modules.users.specification.UserSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final AuditService auditService;

    private static final String CHAR_POOL = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    private static final SecureRandom RANDOM = new SecureRandom();

    @Transactional
    public CreatedUserResponse createUser(CreateUserRequest request, UserPrincipal actor) {
        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("An account is already registered with email: " + email);
        }

        String rawTempPassword = StringUtils.hasText(request.getTemporaryPassword())
                ? request.getTemporaryPassword()
                : generateSecureTemporaryPassword();

        User user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(rawTempPassword))
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .role(request.getRole())
                .status(UserStatus.ACTIVE)
                .department(request.getDepartment())
                .phoneNumber(request.getPhoneNumber())
                .skills(request.getSkills() != null ? request.getSkills() : new ArrayList<>())
                .requiresPasswordChange(true) // Forced first-login password change
                .build();

        User savedUser = userRepository.save(user);

        // Audit Logging
        if (actor != null) {
            auditService.logAsync(
                    actor.getId(),
                    actor.getEmail(),
                    actor.getRole(),
                    "USER_CREATED",
                    "USER",
                    savedUser.getId(),
                    Map.of(
                            "email", savedUser.getEmail(),
                            "role", savedUser.getRole().name(),
                            "department", savedUser.getDepartment() != null ? savedUser.getDepartment() : ""
                    )
            );
        }

        log.info("Provisioned new user: {} (Role: {}) by actor: {}", email, savedUser.getRole(), actor != null ? actor.getEmail() : "SYSTEM");

        return CreatedUserResponse.builder()
                .user(userMapper.toDto(savedUser))
                .temporaryPassword(rawTempPassword)
                .build();
    }

    @Transactional(readOnly = true)
    public PageResponse<UserDto> getUsers(String search, UserRole role, String department, UserStatus status, Pageable pageable) {
        Specification<User> spec = UserSpecification.filterUsers(search, role, department, status);
        Page<UserDto> page = userRepository.findAll(spec, pageable).map(userMapper::toDto);
        return PageResponse.from(page);
    }

    @Transactional(readOnly = true)
    public UserDto getUserById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return userMapper.toDto(user);
    }

    @Transactional
    public UserDto updateUser(String id, UpdateUserRequest request, UserPrincipal actor) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setDepartment(request.getDepartment());
        user.setPhoneNumber(request.getPhoneNumber());
        if (request.getSkills() != null) {
            user.setSkills(request.getSkills());
        }

        User updatedUser = userRepository.save(user);

        if (actor != null) {
            auditService.logAsync(
                    actor.getId(),
                    actor.getEmail(),
                    actor.getRole(),
                    "USER_UPDATED",
                    "USER",
                    updatedUser.getId(),
                    Map.of("updatedFields", List.of("firstName", "lastName", "department", "phoneNumber", "skills"))
            );
        }

        return userMapper.toDto(updatedUser);
    }

    @Transactional
    public UserDto updateUserStatus(String id, UserStatus newStatus, UserPrincipal actor) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        if (actor != null && actor.getId().equals(id) && newStatus != UserStatus.ACTIVE) {
            throw new BadRequestException("You cannot deactivate or lock your own administrator account.");
        }

        UserStatus previousStatus = user.getStatus();
        user.setStatus(newStatus);
        User updatedUser = userRepository.save(user);

        if (actor != null) {
            auditService.logAsync(
                    actor.getId(),
                    actor.getEmail(),
                    actor.getRole(),
                    "USER_STATUS_CHANGED",
                    "USER",
                    updatedUser.getId(),
                    Map.of("previousStatus", previousStatus.name(), "newStatus", newStatus.name())
            );
        }

        log.info("User {} status updated from {} to {} by {}", user.getEmail(), previousStatus, newStatus, actor != null ? actor.getEmail() : "SYSTEM");

        return userMapper.toDto(updatedUser);
    }

    @Transactional(readOnly = true)
    public List<InterviewerSummaryDto> getInterviewers(String department, String skill) {
        List<User> interviewers = userRepository.findByRoleAndStatus(UserRole.ROLE_INTERVIEWER, UserStatus.ACTIVE);

        return interviewers.stream()
                .filter(u -> !StringUtils.hasText(department) || (u.getDepartment() != null && u.getDepartment().equalsIgnoreCase(department.trim())))
                .filter(u -> !StringUtils.hasText(skill) || (u.getSkills() != null && u.getSkills().stream().anyMatch(s -> s.equalsIgnoreCase(skill.trim()))))
                .map(u -> InterviewerSummaryDto.builder()
                        .id(u.getId())
                        .email(u.getEmail())
                        .fullName(u.getFullName())
                        .department(u.getDepartment())
                        .skills(u.getSkills())
                        .activeInterviewsCount(0)
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getUserMetrics() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByStatus(UserStatus.ACTIVE);
        long hrCount = userRepository.countByRole(UserRole.ROLE_HR);
        long interviewerCount = userRepository.countByRole(UserRole.ROLE_INTERVIEWER);
        long managerCount = userRepository.countByRole(UserRole.ROLE_HIRING_MANAGER);
        long candidateCount = userRepository.countByRole(UserRole.ROLE_CANDIDATE);

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalUsers", totalUsers);
        metrics.put("activeUsers", activeUsers);
        metrics.put("hrCount", hrCount);
        metrics.put("interviewerCount", interviewerCount);
        metrics.put("managerCount", managerCount);
        metrics.put("candidateCount", candidateCount);
        return metrics;
    }

    private String generateSecureTemporaryPassword() {
        StringBuilder sb = new StringBuilder(12);
        for (int i = 0; i < 12; i++) {
            sb.append(CHAR_POOL.charAt(RANDOM.nextInt(CHAR_POOL.length())));
        }
        return sb.toString();
    }
}
