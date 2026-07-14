package com.last_island.api.domain.lobby.controller;

import com.last_island.api.infrastructure.security.principal.AuthenticatedUser;
import com.last_island.api.infrastructure.sse.LobbySseRegistry;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Tag(name = "Lobby")
@RestController
@RequestMapping("/lobby")
public class LobbyController {

    private final LobbySseRegistry lobbySseRegistry;

    public LobbyController(LobbySseRegistry lobbySseRegistry) {
        this.lobbySseRegistry = lobbySseRegistry;
    }

    @GetMapping(value = "/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(@AuthenticationPrincipal AuthenticatedUser principal) {
        return lobbySseRegistry.register(principal.getId());
    }
}
