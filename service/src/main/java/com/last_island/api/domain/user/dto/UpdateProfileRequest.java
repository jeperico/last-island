package com.last_island.api.domain.user.dto;

import com.last_island.api.domain.user.enums.Filiation;

public record UpdateProfileRequest(Filiation filiation, String avatar) {
}
