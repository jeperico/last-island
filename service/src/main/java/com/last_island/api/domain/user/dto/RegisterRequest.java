package com.last_island.api.domain.user.dto;

import com.last_island.api.domain.user.enums.Filiation;

public record RegisterRequest(String name, String email, String password, Filiation filiation, String avatar) {
}
