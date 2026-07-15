package com.last_island.api.domain.user.controller;

import com.last_island.api.domain.user.dto.LeaderboardResponse;
import com.last_island.api.domain.user.dto.UpdateProfileRequest;
import com.last_island.api.domain.user.dto.UserResponse;
import com.last_island.api.domain.user.service.LeaderboardService;
import com.last_island.api.domain.user.service.UserService;
import com.last_island.api.infrastructure.security.principal.AuthenticatedUser;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Users")
@RestController
@RequestMapping("/users")
public class UserController {

    private final LeaderboardService leaderboardService;
    private final UserService userService;

    public UserController(LeaderboardService leaderboardService, UserService userService) {
        this.leaderboardService = leaderboardService;
        this.userService = userService;
    }

    @GetMapping("/leaderboard")
    public LeaderboardResponse getLeaderboard(
            @RequestParam(defaultValue = "ALL") String filiation,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return leaderboardService.getLeaderboard(user.getId(), filiation);
    }

    @PutMapping("/me")
    public UserResponse updateProfile(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @RequestBody UpdateProfileRequest request) {
        return userService.updateProfile(principal.getId(), request);
    }
}
