package com.last_island.api.domain.user.dto;

public record RegisterRequest(String name, String email, String password, String avatar) {
}
