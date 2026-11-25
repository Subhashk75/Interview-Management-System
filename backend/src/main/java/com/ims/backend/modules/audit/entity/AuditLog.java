package com.ims.backend.modules.audit.entity;

import com.ims.backend.common.BaseEntity;
import com.ims.backend.common.converter.JsonMapConverter;
import com.ims.backend.modules.users.entity.UserRole;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.Map;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
    name = "audit_logs",
    indexes = {
        @Index(name = "idx_audit_entity_timeline", columnList = "entity_type, entity_id, timestamp"),
        @Index(name = "idx_audit_actor_timeline", columnList = "actor_id, timestamp"),
        @Index(name = "idx_audit_action", columnList = "action"),
        @Index(name = "idx_audit_timestamp", columnList = "timestamp")
    }
)
public class AuditLog extends BaseEntity {

    @Column(name = "actor_id", length = 36)
    private String actorId;

    @Column(name = "actor_email", length = 150)
    private String actorEmail;

    @Enumerated(EnumType.STRING)
    @Column(name = "actor_role", length = 50)
    private UserRole actorRole;

    @Column(name = "action", nullable = false, length = 100)
    private String action; // e.g. USER_CREATED, USER_STATUS_CHANGED, STAGE_TRANSITION

    @Column(name = "entity_type", length = 50)
    private String entityType; // USER, CANDIDATE, JOB, APPLICATION, INTERVIEW, FEEDBACK

    @Column(name = "entity_id", length = 36)
    private String entityId;

    @Convert(converter = JsonMapConverter.class)
    @Column(name = "details", columnDefinition = "TEXT")
    private Map<String, Object> details;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Builder.Default
    @Column(name = "timestamp", nullable = false)
    private Instant timestamp = Instant.now();
}
