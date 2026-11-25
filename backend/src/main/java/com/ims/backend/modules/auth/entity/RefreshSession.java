package com.ims.backend.modules.auth.entity;

import com.ims.backend.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
    name = "refresh_sessions",
    indexes = {
        @Index(name = "idx_refresh_session_id", columnList = "session_id", unique = true),
        @Index(name = "idx_refresh_user_family", columnList = "user_id, family_id"),
        @Index(name = "idx_refresh_expires_at", columnList = "expires_at")
    }
)
public class RefreshSession extends BaseEntity {

    @Column(name = "session_id", nullable = false, unique = true, length = 100)
    private String sessionId;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Column(name = "family_id", length = 100)
    private String familyId;

    @Column(name = "token_hash", nullable = false, length = 255)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Builder.Default
    @Column(name = "revoked", nullable = false)
    private boolean revoked = false;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "replaced_by_session_id", length = 100)
    private String replacedBySessionId;
}
