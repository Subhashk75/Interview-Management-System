package com.ims.backend.modules.auth.entity;

import com.ims.backend.common.BaseEntity;
import lombok.*;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "refresh_sessions")
@CompoundIndex(name = "user_family_idx", def = "{'userId': 1, 'familyId': 1}")
public class RefreshSession extends BaseEntity {

    @Indexed
    private String sessionId;

    @Indexed
    private String userId;

    private String familyId;
    private String tokenHash;
    private Instant expiresAt;
    private boolean revoked;
    private Instant revokedAt;
    private String replacedBySessionId;
}
