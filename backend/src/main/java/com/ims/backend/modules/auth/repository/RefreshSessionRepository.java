package com.ims.backend.modules.auth.repository;

import com.ims.backend.modules.auth.entity.RefreshSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RefreshSessionRepository extends JpaRepository<RefreshSession, String> {
    Optional<RefreshSession> findBySessionId(String sessionId);
    List<RefreshSession> findByUserIdAndRevokedFalse(String userId);
    List<RefreshSession> findByFamilyId(String familyId);
}
