package com.last_island.api.domain.user.dto;

/**
 * Internal value object holding access and refresh tokens.
 * Not serialized to HTTP responses — tokens are delivered via httpOnly cookies.
 */
public record TokenPair(String accessToken, String refreshToken) {
}
