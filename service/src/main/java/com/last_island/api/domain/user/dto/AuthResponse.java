package com.last_island.api.domain.user.dto;

public record AuthResponse(String accessToken, String refreshToken, UserResponse user) {
}
