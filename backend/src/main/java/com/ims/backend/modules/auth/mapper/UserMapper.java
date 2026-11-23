package com.ims.backend.modules.auth.mapper;

import com.ims.backend.modules.auth.dto.UserDto;
import com.ims.backend.modules.users.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserDto toDto(User user) {
        if (user == null) return null;
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFullName())
                .role(user.getRole())
                .status(user.getStatus())
                .department(user.getDepartment())
                .phoneNumber(user.getPhoneNumber())
                .timezone(user.getTimezone())
                .skills(user.getSkills())
                .requiresPasswordChange(user.isRequiresPasswordChange())
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
