package com.ims.backend.modules.auth.service;

import com.ims.backend.modules.users.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long accessExpirationMs;
    private final long refreshExpirationMs;

    public JwtService(
            @Value("${app.jwt.secret:c2VjdXJlLWVudGVycHJpc2UtaW1zLXNlY3JldC1rZXktZXhhbXBsZS0yNTY=}") String secret,
            @Value("${app.jwt.expiration-ms:3600000}") long accessExpirationMs,
            @Value("${app.jwt.refresh-expiration-ms:604800000}") long refreshExpirationMs
    ) {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            // Ensure 256 bits minimum
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, Math.min(keyBytes.length, 32));
            this.signingKey = Keys.hmacShaKeyFor(padded);
        } else {
            this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        }
        this.accessExpirationMs = accessExpirationMs;
        this.refreshExpirationMs = refreshExpirationMs;
    }

    public String generateAccessToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", user.getEmail());
        claims.put("role", user.getRole().name());
        claims.put("requiresPasswordChange", user.isRequiresPasswordChange());

        Instant now = Instant.now();
        Instant expiry = now.plusMillis(accessExpirationMs);

        return Jwts.builder()
                .subject(user.getId())
                .claims(claims)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(signingKey)
                .compact();
    }

    public String generateRefreshToken(User user) {
        return generateRefreshToken(user, java.util.UUID.randomUUID().toString());
    }

    public String generateRefreshToken(User user, String sessionId) {
        Instant now = Instant.now();
        Instant expiry = now.plusMillis(refreshExpirationMs);

        return Jwts.builder()
                .subject(user.getId())
                .claim("type", "REFRESH")
                .claim("sessionId", sessionId)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(signingKey)
                .compact();
    }

    public boolean isRefreshToken(String token) {
        try {
            Claims claims = parseClaims(token);
            return "REFRESH".equals(claims.get("type", String.class))
                    && claims.get("sessionId", String.class) != null;
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }

    public String extractSessionId(String token) {
        return parseClaims(token).get("sessionId", String.class);
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractUserId(String token) {
        return parseClaims(token).getSubject();
    }

    public String extractEmail(String token) {
        return parseClaims(token).get("email", String.class);
    }

    public String extractRole(String token) {
        return parseClaims(token).get("role", String.class);
    }

    public boolean isPasswordChangeRequired(String token) {
        Boolean required = parseClaims(token).get("requiresPasswordChange", Boolean.class);
        return Boolean.TRUE.equals(required);
    }

    public boolean validateToken(String token) {
        try {
            Claims claims = parseClaims(token);
            return claims.getExpiration().after(new Date());
        } catch (JwtException | IllegalArgumentException ex) {
            log.debug("JWT token validation failed: {}", ex.getMessage());
            return false;
        }
    }

    public long getAccessExpirationMs() {
        return accessExpirationMs;
    }
}
