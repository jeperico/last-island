package com.last_island.api.domain.user.dto;

import com.last_island.api.domain.user.enums.Filiation;

import java.util.UUID;

public record UserResponse(UUID id, String name, String email, Filiation filiation, String rank, long bounty, int wins, int losses) {
}
