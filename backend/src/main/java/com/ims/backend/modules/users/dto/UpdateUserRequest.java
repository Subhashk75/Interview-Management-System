package com.ims.backend.modules.users.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
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
public class UpdateUserRequest {

    @NotBlank(message = "First name is required")
    @Schema(example = "Alexandra")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Schema(example = "Smith")
    private String lastName;

    @Schema(example = "Platform Engineering")
    private String department;

    @Schema(example = "+1-555-0199")
    private String phoneNumber;

    @Builder.Default
    @Schema(example = "[\"Java\", \"Distributed Architecture\"]")
    private List<String> skills = new ArrayList<>();
}
