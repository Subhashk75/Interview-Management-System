package com.ims.backend.modules.users.dto;

import com.ims.backend.modules.users.entity.UserRole;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be a valid email format")
    @Schema(example = "alexandra.smith@acme.com")
    private String email;

    @NotBlank(message = "First name is required")
    @Schema(example = "Alexandra")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Schema(example = "Smith")
    private String lastName;

    @NotNull(message = "User role is required")
    @Schema(example = "ROLE_INTERVIEWER")
    private UserRole role;

    @Schema(example = "Engineering")
    private String department;

    @Schema(example = "+1-555-0199")
    private String phoneNumber;

    @Schema(description = "Optional custom temporary password. If omitted, a secure 12-character password is automatically generated.", example = "InitPass2026!")
    private String temporaryPassword;

    @Builder.Default
    @Schema(example = "[\"Java\", \"Spring Boot\", \"System Design\"]")
    private List<String> skills = new ArrayList<>();
}
