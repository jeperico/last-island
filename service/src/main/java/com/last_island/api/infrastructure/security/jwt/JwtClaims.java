package com.last_island.api.infrastructure.security.jwt;

import java.util.UUID;

public record JwtClaims(UUID userId, String email, String name) {
}
