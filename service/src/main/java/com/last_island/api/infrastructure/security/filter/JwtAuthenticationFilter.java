package com.last_island.api.infrastructure.security.filter;

import com.last_island.api.infrastructure.security.jwt.JwtClaims;
import com.last_island.api.infrastructure.security.jwt.JwtProvider;
import com.last_island.api.infrastructure.security.principal.AuthenticatedUser;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;

    public JwtAuthenticationFilter(JwtProvider jwtProvider) {
        this.jwtProvider = jwtProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        try {
            if (jwtProvider.isRefreshToken(token)) {
                filterChain.doFilter(request, response);
                return;
            }

            JwtClaims claims = jwtProvider.parseToken(token);

            AuthenticatedUser principal = new AuthenticatedUser(
                    claims.userId(),
                    claims.email(),
                    claims.name()
            );

            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    principal,
                    null,
                    principal.getAuthorities()
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
        } catch (Exception e) {
            // Token is invalid or expired — continue unauthenticated
        }

        filterChain.doFilter(request, response);
    }
}
