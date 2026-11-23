package com.ims.backend.config;

import com.ims.backend.modules.users.entity.User;
import com.ims.backend.modules.users.entity.UserRole;
import com.ims.backend.modules.users.entity.UserStatus;
import com.ims.backend.modules.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            log.info("Bootstrapping initial system users...");

            // 1. Admin
            User admin = User.builder()
                    .email("admin@ims.internal")
                    .passwordHash(passwordEncoder.encode("AdminPassword123!"))
                    .firstName("System")
                    .lastName("Administrator")
                    .role(UserRole.ROLE_ADMIN)
                    .status(UserStatus.ACTIVE)
                    .department("IT & Operations")
                    .requiresPasswordChange(false)
                    .build();

            // 2. HR Recruiter (requires password change to test first-login guard)
            User hr = User.builder()
                    .email("hr@ims.internal")
                    .passwordHash(passwordEncoder.encode("TempPassword123!"))
                    .firstName("Sarah")
                    .lastName("Connor")
                    .role(UserRole.ROLE_HR)
                    .status(UserStatus.ACTIVE)
                    .department("Talent Acquisition")
                    .requiresPasswordChange(true)
                    .build();

            // 3. Technical Interviewer
            User interviewer = User.builder()
                    .email("interviewer@ims.internal")
                    .passwordHash(passwordEncoder.encode("TempPassword123!"))
                    .firstName("David")
                    .lastName("Ross")
                    .role(UserRole.ROLE_INTERVIEWER)
                    .status(UserStatus.ACTIVE)
                    .department("Engineering")
                    .skills(List.of("Java", "Spring Boot", "Distributed Systems", "MongoDB"))
                    .requiresPasswordChange(true)
                    .build();

            // 4. Hiring Manager
            User manager = User.builder()
                    .email("manager@ims.internal")
                    .passwordHash(passwordEncoder.encode("TempPassword123!"))
                    .firstName("Elena")
                    .lastName("Miller")
                    .role(UserRole.ROLE_HIRING_MANAGER)
                    .status(UserStatus.ACTIVE)
                    .department("Engineering")
                    .requiresPasswordChange(true)
                    .build();

            // 5. Candidate
            User candidate = User.builder()
                    .email("candidate@ims.internal")
                    .passwordHash(passwordEncoder.encode("CandidatePassword123!"))
                    .firstName("Alex")
                    .lastName("Mercer")
                    .role(UserRole.ROLE_CANDIDATE)
                    .status(UserStatus.ACTIVE)
                    .requiresPasswordChange(false)
                    .build();

            userRepository.saveAll(List.of(admin, hr, interviewer, manager, candidate));
            log.info("Initialized 5 baseline users: Admin (active), HR (temp pwd), Interviewer (temp pwd), Manager (temp pwd), Candidate (active).");
        }
    }
}
