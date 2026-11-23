package com.ims.backend.modules.users;

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
import com.ims.backend.modules.users.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private UserMapper userMapper;

    @Mock
    private AuditService auditService;

    @Mock
    private MongoTemplate mongoTemplate;

    @InjectMocks
    private UserService userService;

    private User sampleUser;
    private User adminUser;
    private UserPrincipal adminPrincipal;
    private UserPrincipal interviewerPrincipal;
    private UserDto sampleUserDto;

    @BeforeEach
    void setUp() {
        adminUser = User.builder()
                .email("admin@ims.internal")
                .firstName("System")
                .lastName("Administrator")
                .role(UserRole.ROLE_ADMIN)
                .status(UserStatus.ACTIVE)
                .build();
        adminUser.setId("admin-id");

        adminPrincipal = new UserPrincipal(adminUser);

        sampleUser = User.builder()
                .email("jane.doe@ims.internal")
                .firstName("Jane")
                .lastName("Doe")
                .role(UserRole.ROLE_INTERVIEWER)
                .status(UserStatus.ACTIVE)
                .department("Engineering")
                .skills(List.of("Java", "Spring Boot", "Distributed Systems"))
                .requiresPasswordChange(false)
                .build();
        sampleUser.setId("user-123");

        interviewerPrincipal = new UserPrincipal(sampleUser);

        sampleUserDto = UserDto.builder()
                .id("user-123")
                .email("jane.doe@ims.internal")
                .firstName("Jane")
                .lastName("Doe")
                .fullName("Jane Doe")
                .role(UserRole.ROLE_INTERVIEWER)
                .status(UserStatus.ACTIVE)
                .department("Engineering")
                .skills(List.of("Java", "Spring Boot", "Distributed Systems"))
                .requiresPasswordChange(false)
                .build();
    }

    @Test
    @DisplayName("Should successfully provision a new user with auto-generated temporary password and password reset flag")
    void createUser_Success() {
        CreateUserRequest request = CreateUserRequest.builder()
                .email("alex.smith@ims.internal")
                .firstName("Alex")
                .lastName("Smith")
                .role(UserRole.ROLE_INTERVIEWER)
                .department("Engineering")
                .skills(List.of("Go", "Kubernetes", "System Design"))
                .build();

        when(userRepository.existsByEmail("alex.smith@ims.internal")).thenReturn(false);
        when(passwordEncoder.encode(any(String.class))).thenReturn("$2a$12$hashedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User saved = invocation.getArgument(0);
            saved.setId("user-new-id");
            return saved;
        });
        when(userMapper.toDto(any(User.class))).thenReturn(sampleUserDto);

        CreatedUserResponse response = userService.createUser(request, adminPrincipal);

        assertThat(response).isNotNull();
        assertThat(response.getTemporaryPassword()).isNotEmpty();
        assertThat(response.getTemporaryPassword().length()).isGreaterThanOrEqualTo(12);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User capturedUser = userCaptor.getValue();

        assertThat(capturedUser.getEmail()).isEqualTo("alex.smith@ims.internal");
        assertThat(capturedUser.isRequiresPasswordChange()).isTrue();
        assertThat(capturedUser.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(capturedUser.getPasswordHash()).isEqualTo("$2a$12$hashedPassword");

        verify(auditService).logAsync(
                eq("admin-id"),
                eq("admin@ims.internal"),
                eq(UserRole.ROLE_ADMIN),
                eq("USER_CREATED"),
                eq("USER"),
                eq("user-new-id"),
                any()
        );
    }

    @Test
    @DisplayName("Should throw BadRequestException when creating a user with an already existing email")
    void createUser_DuplicateEmail_ThrowsBadRequest() {
        CreateUserRequest request = CreateUserRequest.builder()
                .email("existing@ims.internal")
                .firstName("Existing")
                .lastName("User")
                .role(UserRole.ROLE_HR)
                .build();

        when(userRepository.existsByEmail("existing@ims.internal")).thenReturn(true);

        assertThatThrownBy(() -> userService.createUser(request, adminPrincipal))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("An account is already registered with email: existing@ims.internal");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should retrieve paginated list of users using mongoTemplate query")
    void getUsers_Success() {
        List<User> userList = List.of(sampleUser);
        Pageable pageable = PageRequest.of(0, 10);

        when(mongoTemplate.find(any(Query.class), eq(User.class))).thenReturn(userList);
        when(mongoTemplate.count(any(Query.class), eq(User.class))).thenReturn(1L);
        when(userMapper.toDto(sampleUser)).thenReturn(sampleUserDto);

        PageResponse<UserDto> response = userService.getUsers(
                "Jane",
                UserRole.ROLE_INTERVIEWER,
                "Engineering",
                UserStatus.ACTIVE,
                pageable
        );

        assertThat(response).isNotNull();
        assertThat(response.getTotalElements()).isEqualTo(1L);
        assertThat(response.getContent()).hasSize(1);
        assertThat(response.getContent().get(0).getEmail()).isEqualTo("jane.doe@ims.internal");
    }

    @Test
    @DisplayName("Should successfully update user profile details")
    void updateUser_Success() {
        UpdateUserRequest updateRequest = UpdateUserRequest.builder()
                .firstName("Jane")
                .lastName("Doe-Updated")
                .phoneNumber("+1-555-0199")
                .department("Platform Engineering")
                .skills(List.of("Architecture", "Cloud Native"))
                .build();

        when(userRepository.findById("user-123")).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userMapper.toDto(any(User.class))).thenReturn(sampleUserDto);

        UserDto result = userService.updateUser("user-123", updateRequest, adminPrincipal);

        assertThat(result).isNotNull();
        verify(userRepository).save(any(User.class));
        verify(auditService).logAsync(
                eq("admin-id"),
                eq("admin@ims.internal"),
                eq(UserRole.ROLE_ADMIN),
                eq("USER_UPDATED"),
                eq("USER"),
                eq("user-123"),
                any()
        );
    }

    @Test
    @DisplayName("Should prevent administrator from deactivating their own account")
    void updateUserStatus_SelfDeactivationPrevented() {
        when(userRepository.findById("admin-id")).thenReturn(Optional.of(adminUser));

        // When the requesting actor attempts to deactivate themselves
        assertThatThrownBy(() -> userService.updateUserStatus("admin-id", UserStatus.INACTIVE, adminPrincipal))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("You cannot deactivate or lock your own administrator account");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should successfully update another user's status and audit the transition")
    void updateUserStatus_Success() {
        when(userRepository.findById("user-123")).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userMapper.toDto(any(User.class))).thenReturn(sampleUserDto);

        UserDto result = userService.updateUserStatus("user-123", UserStatus.INACTIVE, adminPrincipal);

        assertThat(result).isNotNull();
        assertThat(sampleUser.getStatus()).isEqualTo(UserStatus.INACTIVE);
        verify(auditService).logAsync(
                eq("admin-id"),
                eq("admin@ims.internal"),
                eq(UserRole.ROLE_ADMIN),
                eq("USER_STATUS_CHANGED"),
                eq("USER"),
                eq("user-123"),
                any()
        );
    }

    @Test
    @DisplayName("Should fetch active interviewers and filter by department or skill")
    void getInterviewers_FilterBySkill() {
        when(userRepository.findByRoleAndStatus(UserRole.ROLE_INTERVIEWER, UserStatus.ACTIVE)).thenReturn(List.of(sampleUser));

        List<InterviewerSummaryDto> interviewers = userService.getInterviewers("Engineering", "Java");

        assertThat(interviewers).hasSize(1);
        assertThat(interviewers.get(0).getFullName()).isEqualTo("Jane Doe");
        assertThat(interviewers.get(0).getSkills()).contains("Java");
    }

    @Test
    @DisplayName("Should aggregate user metrics correctly")
    void getUserMetrics_Success() {
        when(userRepository.count()).thenReturn(10L);
        when(userRepository.countByStatus(UserStatus.ACTIVE)).thenReturn(8L);
        when(userRepository.countByRole(UserRole.ROLE_HR)).thenReturn(2L);
        when(userRepository.countByRole(UserRole.ROLE_INTERVIEWER)).thenReturn(5L);
        when(userRepository.countByRole(UserRole.ROLE_HIRING_MANAGER)).thenReturn(2L);
        when(userRepository.countByRole(UserRole.ROLE_CANDIDATE)).thenReturn(1L);

        Map<String, Object> metrics = userService.getUserMetrics();

        assertThat(metrics.get("totalUsers")).isEqualTo(10L);
        assertThat(metrics.get("activeUsers")).isEqualTo(8L);
        assertThat(metrics.get("interviewerCount")).isEqualTo(5L);
    }
}
