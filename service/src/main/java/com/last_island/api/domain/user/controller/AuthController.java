package com.last_island.api.domain.user.controller;

import com.last_island.api.domain.user.dto.*;
import com.last_island.api.domain.user.service.AuthService;
import com.last_island.api.infrastructure.security.jwt.JwtProperties;
import com.last_island.api.infrastructure.security.principal.AuthenticatedUser;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@Tag(name = "Auth")
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtProperties jwtProperties;

    @Value("${app.cookie.secure:false}")
    private boolean cookieSecure;

    public AuthController(AuthService authService, JwtProperties jwtProperties) {
        this.authService = authService;
        this.jwtProperties = jwtProperties;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@RequestBody RegisterRequest request, HttpServletResponse response) {
        AuthResult result = authService.register(request);
        setAuthCookies(response, result.tokens());
        return new AuthResponse(result.user());
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request, HttpServletResponse response) {
        AuthResult result = authService.login(request);
        setAuthCookies(response, result.tokens());
        return new AuthResponse(result.user());
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = extractCookieValue(request, "refresh_token");
        if (refreshToken == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No refresh token cookie");
        }
        AuthResult result = authService.refresh(refreshToken);
        setAuthCookies(response, result.tokens());
        return new AuthResponse(result.user());
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletResponse response) {
        clearAuthCookies(response);
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal AuthenticatedUser principal) {
        return authService.getProfile(principal.getId());
    }

    // ─── Cookie helpers ──────────────────────────────────────────────────────

    private void setAuthCookies(HttpServletResponse response, TokenPair tokens) {
        int accessMaxAge = (int) (jwtProperties.getAccessExpiration() / 1000);
        int refreshMaxAge = (int) (jwtProperties.getRefreshExpiration() / 1000);

        Cookie accessCookie = new Cookie("access_token", tokens.accessToken());
        accessCookie.setHttpOnly(true);
        accessCookie.setSecure(cookieSecure);
        accessCookie.setPath("/");
        accessCookie.setMaxAge(accessMaxAge);
        accessCookie.setAttribute("SameSite", "Lax");
        response.addCookie(accessCookie);

        Cookie refreshCookie = new Cookie("refresh_token", tokens.refreshToken());
        refreshCookie.setHttpOnly(true);
        refreshCookie.setSecure(cookieSecure);
        refreshCookie.setPath("/");
        refreshCookie.setMaxAge(refreshMaxAge);
        refreshCookie.setAttribute("SameSite", "Lax");
        response.addCookie(refreshCookie);
    }

    private void clearAuthCookies(HttpServletResponse response) {
        Cookie accessCookie = new Cookie("access_token", "");
        accessCookie.setHttpOnly(true);
        accessCookie.setSecure(cookieSecure);
        accessCookie.setPath("/");
        accessCookie.setMaxAge(0);
        accessCookie.setAttribute("SameSite", "Lax");
        response.addCookie(accessCookie);

        Cookie refreshCookie = new Cookie("refresh_token", "");
        refreshCookie.setHttpOnly(true);
        refreshCookie.setSecure(cookieSecure);
        refreshCookie.setPath("/");
        refreshCookie.setMaxAge(0);
        refreshCookie.setAttribute("SameSite", "Lax");
        response.addCookie(refreshCookie);
    }

    private String extractCookieValue(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (name.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}
