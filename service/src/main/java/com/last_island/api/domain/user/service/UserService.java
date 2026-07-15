package com.last_island.api.domain.user.service;

import com.last_island.api.domain.user.dto.UpdateProfileRequest;
import com.last_island.api.domain.user.dto.UserResponse;
import com.last_island.api.domain.user.entity.User;
import com.last_island.api.domain.user.enums.Avatar;
import com.last_island.api.domain.user.mapper.UserMapper;
import com.last_island.api.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional
    public UserResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Avatar newAvatar;
        if (request.avatar() != null) {
            try {
                newAvatar = Avatar.valueOf(request.avatar());
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid avatar value");
            }
        } else {
            newAvatar = null;
        }

        user.setAvatar(newAvatar);
        userRepository.save(user);

        return UserMapper.toResponse(user);
    }
}
