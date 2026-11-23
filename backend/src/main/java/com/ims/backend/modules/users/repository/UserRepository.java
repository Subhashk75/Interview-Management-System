package com.ims.backend.modules.users.repository;

import com.ims.backend.modules.users.entity.User;
import com.ims.backend.modules.users.entity.UserRole;
import com.ims.backend.modules.users.entity.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRoleAndStatus(UserRole role, UserStatus status);

    Page<User> findByRole(UserRole role, Pageable pageable);

    Page<User> findByDepartment(String department, Pageable pageable);

    long countByRole(UserRole role);

    long countByStatus(UserStatus status);
}
