package com.ims.backend.modules.auth.dto;

import com.ims.backend.modules.users.entity.UserRole;
import com.ims.backend.modules.users.entity.UserStatus;
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
public class UserDto {
    private String id;
    private String email;
    private String firstName;
    private String lastName;
    private String fullName;
    private UserRole role;
    private UserStatus status;
    private String department;
    private String phoneNumber;
    private String timezone;
    private List<String> skills;
    private boolean requiresPasswordChange;
    private Instant lastLoginAt;
    private Instant createdAt;
}
