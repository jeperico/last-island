package com.last_island.api.infrastructure.sse;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Service
public class LobbyEventEmitter {

    private final LobbySseRegistry registry;

    public LobbyEventEmitter(LobbySseRegistry registry) {
        this.registry = registry;
    }

    public void emitGameCreated(String token, String bluePlayerName, LocalDateTime createdAt) {
        LobbyEvent event = LobbyEvent.of(LobbyEvent.GAME_CREATED, Map.of(
                "token", token,
                "bluePlayerName", bluePlayerName,
                "createdAt", createdAt.toString()
        ));
        registry.broadcast(event);
    }

    public void emitGameRemoved(String token) {
        LobbyEvent event = LobbyEvent.of(LobbyEvent.GAME_REMOVED, Map.of(
                "token", token
        ));
        registry.broadcast(event);
    }
}
