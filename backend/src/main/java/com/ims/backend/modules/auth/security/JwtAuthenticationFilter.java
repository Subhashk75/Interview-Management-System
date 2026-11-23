package com.ims.backend.modules.auth.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ims.backend.common.ApiErrorResponse;
import com.ims.backend.modules.auth.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsServiceImpl userDetailsService;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String token = parseJwt(request);

        if (token != null && jwtService.validateToken(token)) {
            String userId = jwtService.extractUserId(token);
            boolean requiresPwdChange = jwtService.isPasswordChangeRequired(token);
            String uri = request.getRequestURI();

            // First-login security policy enforcement:
            // If password change is required, block any business endpoint other than change-password and current user profile
            if (requiresPwdChange && !isAllowedWhilePasswordChangeRequired(uri)) {
                log.warn("Blocked request to {} for user {}: password change is required", uri, userId);
                sendPasswordChangeRequiredError(response);
                return;
            }

            UserDetails userDetails = userDetailsService.loadUserById(userId);
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userDetails,
                    null,
                    userDetails.getAuthorities()
            );
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }
        return null;
    }

    private boolean isAllowedWhilePasswordChangeRequired(String uri) {
        return uri.endsWith("/api/v1/auth/change-password")
                || uri.endsWith("/api/v1/auth/me")
                || uri.endsWith("/api/v1/auth/logout")
                || uri.contains("/actuator")
                || uri.contains("/v3/api-docs")
                || uri.contains("/swagger-ui");
    }

    private void sendPasswordChangeRequiredError(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        ApiErrorResponse error = ApiErrorResponse.of(
                "PASSWORD_CHANGE_REQUIRED",
                "First-time password change is mandatory before accessing application resources."
        );
        objectMapper.writeValue(response.getOutputStream(), error);
    }
}
