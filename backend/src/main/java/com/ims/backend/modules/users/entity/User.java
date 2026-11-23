package com.ims.backend.modules.users.entity;

import com.ims.backend.common.BaseEntity;
import lombok.*;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
@CompoundIndexes({
    @CompoundIndex(name = "role_status_idx", def = "{'role': 1, 'status': 1}"),
    @CompoundIndex(name = "department_idx", def = "{'department': 1}")
})
public class User extends BaseEntity {

    @Indexed(unique = true)
    private String email;

    private String passwordHash;

    private String firstName;

    private String lastName;

    private UserRole role;

    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    private String department;

    private String phoneNumber;

    @Builder.Default
    private String timezone = "UTC";

    @Builder.Default
    private List<String> skills = new ArrayList<>();

    @Builder.Default
    private boolean requiresPasswordChange = false;

    private Instant lastLoginAt;

    public String getFullName() {
        if (firstName == null && lastName == null) return email;
        if (firstName == null) return lastName;
        if (lastName == null) return firstName;
        return firstName + " " + lastName;
    }
}
