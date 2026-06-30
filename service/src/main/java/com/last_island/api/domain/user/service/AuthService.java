package com.last_island.api.domain.user.service;

import com.last_island.api.domain.user.dto.*;
import com.last_island.api.domain.user.entity.User;
import com.last_island.api.domain.user.enums.Filiation;
import com.last_island.api.domain.user.mapper.UserMapper;
import com.last_island.api.domain.user.repository.UserRepository;
import com.last_island.api.infrastructure.security.jwt.JwtClaims;
import com.last_island.api.infrastructure.security.jwt.JwtProvider;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtProvider jwtProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtProvider = jwtProvider;
    }

    public AuthResponse register(RegisterRequest request) {
        if (request.password() == null || request.password().length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters");
        }

        if (userRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
        }

        if (userRepository.existsByName(request.name())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Name already in use");
        }

        String defaultRank = request.filiation() == Filiation.PIRATA ? "ROOKIE" : "MARINHEIRO";

        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .filiation(request.filiation())
                .rank(defaultRank)
                .bounty(0)
                .wins(0)
                .losses(0)
                .totalShots(0)
                .totalHits(0)
                .build();

        user = userRepository.save(user);

        String accessToken = jwtProvider.generateAccessToken(user);
        String refreshToken = jwtProvider.generateRefreshToken(user);

        return new AuthResponse(accessToken, refreshToken, UserMapper.toResponse(user));
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        String accessToken = jwtProvider.generateAccessToken(user);
        String refreshToken = jwtProvider.generateRefreshToken(user);

        return new AuthResponse(accessToken, refreshToken, UserMapper.toResponse(user));
    }

    public AuthResponse refresh(RefreshRequest request) {
        JwtClaims claims;
        try {
            claims = jwtProvider.parseToken(request.refreshToken());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired refresh token");
        }

        if (!jwtProvider.isRefreshToken(request.refreshToken())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token is not a refresh token");
        }

        User user = userRepository.findById(claims.userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        String accessToken = jwtProvider.generateAccessToken(user);
        String refreshToken = jwtProvider.generateRefreshToken(user);

        return new AuthResponse(accessToken, refreshToken, UserMapper.toResponse(user));
    }

    public UserResponse getProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return UserMapper.toResponse(user);
    }
}
