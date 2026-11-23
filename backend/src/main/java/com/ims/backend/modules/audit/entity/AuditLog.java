package com.ims.backend.modules.audit.entity;

import com.ims.backend.common.BaseEntity;
import com.ims.backend.modules.users.entity.UserRole;
import lombok.*;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Map;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "audit_logs")
@CompoundIndexes({
    @CompoundIndex(name = "entity_timeline_idx", def = "{'entityType': 1, 'entityId': 1, 'timestamp': -1}"),
    @CompoundIndex(name = "actor_timeline_idx", def = "{'actorId': 1, 'timestamp': -1}")
})
public class AuditLog extends BaseEntity {

    private String actorId;
    private String actorEmail;
    private UserRole actorRole;

    @Indexed
    private String action; // e.g. USER_CREATED, USER_STATUS_CHANGED, STAGE_TRANSITION

    private String entityType; // USER, CANDIDATE, JOB, APPLICATION, INTERVIEW, FEEDBACK
    private String entityId;

    private Map<String, Object> details;

    private String ipAddress;

    @Indexed
    @Builder.Default
    private Instant timestamp = Instant.now();
}
