package com.last_island.api.infrastructure.sse;

import java.util.Map;

public record LobbyEvent(
    String type,
    Map<String, Object> data
) {
    public static final String LOBBY_CONNECTED = "LOBBY_CONNECTED";
    public static final String GAME_CREATED = "GAME_CREATED";
    public static final String GAME_REMOVED = "GAME_REMOVED";

    public static LobbyEvent of(String type, Map<String, Object> data) {
        return new LobbyEvent(type, data);
    }

    public static LobbyEvent of(String type) {
        return new LobbyEvent(type, Map.of());
    }
}
