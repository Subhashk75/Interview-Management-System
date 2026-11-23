package com.ims.backend.modules.audit.service;

import com.ims.backend.modules.audit.entity.AuditLog;
import com.ims.backend.modules.audit.repository.AuditLogRepository;
import com.ims.backend.modules.users.entity.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Async
    public void logAsync(
            String actorId,
            String actorEmail,
            UserRole actorRole,
            String action,
            String entityType,
            String entityId,
            Map<String, Object> details
    ) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .actorId(actorId)
                    .actorEmail(actorEmail)
                    .actorRole(actorRole)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .details(details)
                    .timestamp(Instant.now())
                    .build();

            auditLogRepository.save(auditLog);
            log.debug("Audit event saved: action={} entityType={} entityId={}", action, entityType, entityId);
        } catch (Exception ex) {
            log.error("Failed to record audit log: action={} entityId={}", action, entityId, ex);
        }
    }

    public Page<AuditLog> getRecentAuditLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByTimestampDesc(pageable);
    }
}
