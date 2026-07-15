package com.last_island.api.domain.user.mapper;

import com.last_island.api.domain.user.dto.UserResponse;
import com.last_island.api.domain.user.entity.User;

public final class UserMapper {

    private UserMapper() {
    }

    public static UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getFiliation(),
                user.getRank(),
                user.getBounty(),
                user.getWins(),
                user.getLosses(),
                user.getAvatar() != null ? user.getAvatar().name() : null
        );
    }
}
