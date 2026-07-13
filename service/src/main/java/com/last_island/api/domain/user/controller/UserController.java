package com.last_island.api.domain.user.controller;

import com.last_island.api.domain.user.dto.LeaderboardResponse;
import com.last_island.api.domain.user.service.LeaderboardService;
import com.last_island.api.infrastructure.security.principal.AuthenticatedUser;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Users")
@RestController
@RequestMapping("/users")
public class UserController {

    private final LeaderboardService leaderboardService;

    public UserController(LeaderboardService leaderboardService) {
        this.leaderboardService = leaderboardService;
    }

    @GetMapping("/leaderboard")
    public LeaderboardResponse getLeaderboard(
            @RequestParam(defaultValue = "ALL") String filiation,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return leaderboardService.getLeaderboard(user.getId(), filiation);
    }
}
