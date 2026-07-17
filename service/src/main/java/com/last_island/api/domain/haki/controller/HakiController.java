package com.last_island.api.domain.haki.controller;

import com.last_island.api.domain.haki.dto.HakiProfileResponse;
import com.last_island.api.domain.haki.dto.HakiUpgradeRequest;
import com.last_island.api.domain.haki.service.HakiService;
import com.last_island.api.infrastructure.security.principal.AuthenticatedUser;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Haki")
@RestController
@RequestMapping("/haki")
public class HakiController {

    private final HakiService hakiService;

    public HakiController(HakiService hakiService) {
        this.hakiService = hakiService;
    }

    @GetMapping("/profile")
    public HakiProfileResponse getProfile(@AuthenticationPrincipal AuthenticatedUser principal) {
        return hakiService.getProfile(principal.getId());
    }

    @PostMapping("/upgrade")
    public HakiProfileResponse upgrade(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @RequestBody HakiUpgradeRequest request) {
        return hakiService.spendPoints(principal.getId(), request.hakiType(), request.targetLevel());
    }
}
