package com.ims.backend.modules.users.entity;

import com.ims.backend.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
    name = "users",
    indexes = {
        @Index(name = "idx_users_email", columnList = "email", unique = true),
        @Index(name = "idx_users_role_status", columnList = "role, status"),
        @Index(name = "idx_users_department", columnList = "department")
    }
)
public class User extends BaseEntity {

    @Column(name = "email", unique = true, nullable = false, length = 150)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 50)
    private UserRole role;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private UserStatus status = UserStatus.ACTIVE;

    @Column(name = "department", length = 100)
    private String department;

    @Column(name = "phone_number", length = 50)
    private String phoneNumber;

    @Builder.Default
    @Column(name = "timezone", length = 50)
    private String timezone = "UTC";

    @Builder.Default
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_skills", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "skill", length = 100)
    private List<String> skills = new ArrayList<>();

    @Builder.Default
    @Column(name = "requires_password_change", nullable = false)
    private boolean requiresPasswordChange = false;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    public String getFullName() {
        if (firstName == null && lastName == null) return email;
        if (firstName == null) return lastName;
        if (lastName == null) return firstName;
        return firstName + " " + lastName;
    }
}
