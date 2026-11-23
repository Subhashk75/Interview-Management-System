package com.ims.backend.modules.users.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewerSummaryDto {

    private String id;
    private String email;
    private String fullName;
    private String department;
    private List<String> skills;
    private long activeInterviewsCount;
}
