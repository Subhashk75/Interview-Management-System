package com.ims.backend.modules.auth.repository;

import com.ims.backend.modules.auth.entity.RefreshSession;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface RefreshSessionRepository extends MongoRepository<RefreshSession, String> {
    Optional<RefreshSession> findBySessionId(String sessionId);
    List<RefreshSession> findByUserIdAndRevokedFalse(String userId);
    List<RefreshSession> findByFamilyId(String familyId);
}
