package com.last_island.api.domain.user.dto;

import java.util.UUID;

public record UserResponse(UUID id, String name, String email, String rank, long bounty, int wins, int losses, String avatar) {
}
