package com.last_island.api.infrastructure.sse;

import java.util.Map;

public record GameEvent(
    long id,
    String type,
    Map<String, Object> data
) {
    public static final String CONNECTED = "CONNECTED";
    public static final String OPPONENT_JOINED = "OPPONENT_JOINED";
    public static final String SHIPS_PLACED = "SHIPS_PLACED";
    public static final String SHOT_RECEIVED = "SHOT_RECEIVED";
    public static final String GAME_OVER = "GAME_OVER";
    public static final String TURN_EXPIRED = "TURN_EXPIRED";
    public static final String GAME_EXPIRED = "GAME_EXPIRED";
    public static final String SURRENDER = "SURRENDER";
    public static final String OBSERVATION_HAKI_USED = "OBSERVATION_HAKI_USED";
    public static final String ARMAMENT_HAKI_TRIGGERED = "ARMAMENT_HAKI_TRIGGERED";
    public static final String CONQUERORS_HAKI_USED = "CONQUERORS_HAKI_USED";
    public static final String DEPLOYMENT_CANCELLED = "DEPLOYMENT_CANCELLED";

    public static GameEvent of(long id, String type, Map<String, Object> data) {
        return new GameEvent(id, type, data);
    }

    public static GameEvent of(long id, String type) {
        return new GameEvent(id, type, Map.of());
    }
}
