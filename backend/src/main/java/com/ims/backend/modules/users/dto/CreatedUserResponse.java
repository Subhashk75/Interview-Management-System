package com.ims.backend.modules.users.dto;

import com.ims.backend.modules.auth.dto.UserDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatedUserResponse {

    private UserDto user;
    private String temporaryPassword;
}
