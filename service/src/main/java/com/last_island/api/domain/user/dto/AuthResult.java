package com.last_island.api.domain.user.dto;

/**
 * Internal result wrapper returned by AuthService methods.
 * The controller extracts tokens for cookies and user for the response body.
 */
public record AuthResult(TokenPair tokens, UserResponse user) {
}
