package com.survivalkit.backend.core.security;

import com.survivalkit.backend.adapter.postgres.user.UserPersistancePort;
import com.survivalkit.backend.core.user.AuthenticatedUser;
import com.survivalkit.backend.shared.RoleLevel;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import io.viascom.nanoid.NanoId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.security.Key;
import java.time.Duration;
import java.util.Date;
import java.util.Optional;

@Service
public class TokenService {

    private static final String REVOKED_PREFIX = "revoked_jti:";
    private static final String SESSION_PREFIX = "session:";
    private static final String SESSION_LOCK_PREFIX = "session-lock:";
    private static final long ROTATE_AFTER_MS = Duration.ofMinutes(1).toMillis();

    private final Key signingKey;
    private final long expirationMs;
    private final UserPersistancePort userPersistancePort;
    private final StringRedisTemplate redisTemplate;

    public TokenService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs, UserPersistancePort userPersistancePort, StringRedisTemplate redisTemplate
    ) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes());
        this.expirationMs = expirationMs;
        this.userPersistancePort = userPersistancePort;
        this.redisTemplate = redisTemplate;
    }

    public String generateToken(String userId, RoleLevel role, String email, String username) {
        var sid = NanoId.generate(25);
        var jti = NanoId.generate(25);
        storeSession(sid, jti);
        return buildToken(sid, jti, userId, role, email, username);
    }

    public Optional<String> slide(AuthenticatedUser user) {
        if (user.token() == null || user.token().isBlank()) {
            return Optional.empty();
        }

        try {
            var claims = parse(user.token());
            if (isRevoked(claims.getId())) {
                return Optional.empty();
            }

            var sid = claims.get("sid", String.class);
            if (sid == null) {
                return Optional.of(generateToken(user.userId(), user.role(), user.email(), user.username()));
            }

            if (!sessionActive(sid)) {
                return Optional.empty();
            }

            var issuedAt = claims.getIssuedAt();
            if (issuedAt != null && System.currentTimeMillis() - issuedAt.getTime() < ROTATE_AFTER_MS) {
                return Optional.empty();
            }

            var locked = redisTemplate.opsForValue().setIfAbsent(
                    SESSION_LOCK_PREFIX + sid,
                    "1",
                    Duration.ofMinutes(5)
            );
            if (!Boolean.TRUE.equals(locked)) {
                return Optional.empty();
            }

            var jti = NanoId.generate(25);
            storeSession(sid, jti);
            return Optional.of(buildToken(sid, jti, user.userId(), user.role(), user.email(), user.username()));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    public Optional<AuthenticatedUser> validate(String token) {
        try {
            var claims = parse(token);

            var jti = claims.getId();
            if (isRevoked(jti)) {
                return Optional.empty();
            }

            var sid = claims.get("sid", String.class);
            if (sid != null && !touchSession(sid)) {
                return Optional.empty();
            }

            var user = userPersistancePort.getById(claims.getSubject());
            return user.map(userModel -> new AuthenticatedUser(
                    token,
                    claims.getSubject(),
                    userModel.username(),
                    userModel.role(),
                    userModel.email(),
                    userModel.isVerified()
            ));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    public void revoke(String token) {
        try {
            var claims = parse(token);

            var sid = claims.get("sid", String.class);
            if (sid != null) {
                redisTemplate.delete(SESSION_PREFIX + sid);
                redisTemplate.delete(SESSION_LOCK_PREFIX + sid);
            }

            var jti = claims.getId();
            var remainingTtl = claims.getExpiration().getTime() - System.currentTimeMillis();

            if (jti != null && remainingTtl > 0) {
                redisTemplate.opsForValue().set(
                        REVOKED_PREFIX + jti,
                        "1",
                        Duration.ofMillis(remainingTtl)
                );
            }
        } catch (JwtException | IllegalArgumentException e) {
        }
    }

    private boolean isRevoked(String jti) {
        return jti != null && Boolean.TRUE.equals(redisTemplate.hasKey(REVOKED_PREFIX + jti));
    }

    private Claims parse(String token) {
        return Jwts.parser()
                .verifyWith((SecretKey) signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private String buildToken(String sid, String jti, String userId, RoleLevel role, String email, String username) {
        var now = System.currentTimeMillis();
        return Jwts.builder()
                .id(jti)
                .subject(userId)
                .claim("sid", sid)
                .claim("role", role.name())
                .claim("email", email)
                .claim("username", username)
                .issuedAt(new Date(now))
                .expiration(new Date(now + expirationMs))
                .signWith(signingKey)
                .compact();
    }

    private void storeSession(String sid, String jti) {
        redisTemplate.opsForValue().set(SESSION_PREFIX + sid, jti, Duration.ofMillis(expirationMs));
    }

    private boolean sessionActive(String sid) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(SESSION_PREFIX + sid));
    }

    private boolean touchSession(String sid) {
        if (!sessionActive(sid)) {
            return false;
        }
        return Boolean.TRUE.equals(redisTemplate.expire(SESSION_PREFIX + sid, Duration.ofMillis(expirationMs)));
    }
}