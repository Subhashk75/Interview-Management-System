package com.ims.backend.modules.auth.service;

import com.ims.backend.exception.UnauthorizedException;
import com.ims.backend.modules.auth.entity.RefreshSession;
import com.ims.backend.modules.auth.repository.RefreshSessionRepository;
import com.ims.backend.modules.users.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshSessionService {

    private final RefreshSessionRepository refreshSessionRepository;

    @Value("${app.jwt.refresh-expiration-ms:604800000}")
    private long refreshExpirationMs;

    public String createRefreshSession(User user, JwtService jwtService) {
        String sessionId = UUID.randomUUID().toString();
        String familyId = UUID.randomUUID().toString();
        String rawToken = jwtService.generateRefreshToken(user, sessionId);
        saveSession(sessionId, familyId, user.getId(), rawToken);
        return rawToken;
    }

    public RefreshRotation rotateRefreshSession(String rawToken, JwtService jwtService, User user) {
        String sessionId = jwtService.extractSessionId(rawToken);
        RefreshSession current = refreshSessionRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh session"));

        if (!current.getTokenHash().equals(hash(rawToken))) {
            revokeFamily(current.getFamilyId());
            throw new UnauthorizedException("Refresh token reuse detected");
        }

        if (current.isRevoked()) {
            revokeFamily(current.getFamilyId());
            throw new UnauthorizedException("Refresh token has been revoked");
        }

        if (current.getExpiresAt().isBefore(Instant.now())) {
            revokeSession(current);
            throw new UnauthorizedException("Refresh token has expired");
        }

        String newSessionId = UUID.randomUUID().toString();
        String newRawToken = jwtService.generateRefreshToken(user, newSessionId);

        current.setRevoked(true);
        current.setRevokedAt(Instant.now());
        current.setReplacedBySessionId(newSessionId);
        refreshSessionRepository.save(current);

        saveSession(newSessionId, current.getFamilyId(), user.getId(), newRawToken);
        return new RefreshRotation(jwtService.generateAccessToken(user), newRawToken);
    }

    public void revokeSession(String sessionId) {
        refreshSessionRepository.findBySessionId(sessionId).ifPresent(this::revokeSession);
    }

    public void revokeAllForUser(String userId) {
        refreshSessionRepository.findByUserIdAndRevokedFalse(userId).forEach(this::revokeSession);
    }

    private void revokeSession(RefreshSession session) {
        session.setRevoked(true);
        session.setRevokedAt(Instant.now());
        refreshSessionRepository.save(session);
    }

    private void revokeFamily(String familyId) {
        refreshSessionRepository.findByFamilyId(familyId).forEach(this::revokeSession);
    }

    private void saveSession(String sessionId, String familyId, String userId, String rawToken) {
        RefreshSession session = RefreshSession.builder()
                .sessionId(sessionId)
                .familyId(familyId)
                .userId(userId)
                .tokenHash(hash(rawToken))
                .expiresAt(Instant.now().plusMillis(refreshExpirationMs))
                .revoked(false)
                .build();
        refreshSessionRepository.save(session);
    }

    private String hash(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to hash refresh token", ex);
        }
    }

    public record RefreshRotation(String accessToken, String refreshToken) {
    }
}
