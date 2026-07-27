package com.last_island.api.infrastructure.sse;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

import com.last_island.api.domain.haki.dto.CounterFireResult;

@Service
public class GameEventEmitter {

    private final SseConnectionRegistry registry;

    public GameEventEmitter(SseConnectionRegistry registry) {
        this.registry = registry;
    }

    public void emitOpponentJoined(String gameToken, UUID bluePlayerId, String joinerName) {
        long id = registry.nextEventId(gameToken);
        GameEvent event = GameEvent.of(id, GameEvent.OPPONENT_JOINED, Map.of("joinerName", joinerName));
        registry.send(gameToken, bluePlayerId, event);
    }

    public void emitShipsPlaced(String gameToken, UUID opponentId) {
        long id = registry.nextEventId(gameToken);
        GameEvent event = GameEvent.of(id, GameEvent.SHIPS_PLACED, Map.of());
        registry.send(gameToken, opponentId, event);
    }

    public void emitGameStarted(String gameToken) {
        long id = registry.nextEventId(gameToken);
        GameEvent event = GameEvent.of(id, GameEvent.SHIPS_PLACED, Map.of("gameStarted", true));
        registry.sendToGame(gameToken, event);
    }

    public void emitShotReceived(String gameToken, UUID targetPlayerId, int row, int col, String result, String sunkShipType, boolean isMyTurn) {
        long id = registry.nextEventId(gameToken);
        Map<String, Object> data = new java.util.HashMap<>();
        data.put("row", row);
        data.put("col", col);
        data.put("result", result);
        data.put("isMyTurn", isMyTurn);
        if (sunkShipType != null) {
            data.put("sunkShipType", sunkShipType);
        }
        GameEvent event = GameEvent.of(id, GameEvent.SHOT_RECEIVED, data);
        registry.send(gameToken, targetPlayerId, event);
    }

    public void emitGameOver(String gameToken, String winnerName) {
        long id = registry.nextEventId(gameToken);
        GameEvent event = GameEvent.of(id, GameEvent.GAME_OVER, Map.of("winnerName", winnerName));
        registry.sendToGame(gameToken, event);
    }

    public void emitTurnExpired(String gameToken, String newTurnPlayerName) {
        long id = registry.nextEventId(gameToken);
        GameEvent event = GameEvent.of(id, GameEvent.TURN_EXPIRED, Map.of("newTurnPlayerName", newTurnPlayerName));
        registry.sendToGame(gameToken, event);
    }

    public void emitGameExpired(String gameToken) {
        long id = registry.nextEventId(gameToken);
        GameEvent event = GameEvent.of(id, GameEvent.GAME_EXPIRED);
        registry.sendToGame(gameToken, event);
    }

    public void emitSurrender(String gameToken, UUID targetPlayerId, String surrenderedPlayerName) {
        long id = registry.nextEventId(gameToken);
        GameEvent event = GameEvent.of(id, GameEvent.SURRENDER, Map.of("surrenderedPlayerName", surrenderedPlayerName));
        registry.send(gameToken, targetPlayerId, event);
    }

    public void emitObservationHakiUsed(String gameToken, UUID opponentId) {
        long id = registry.nextEventId(gameToken);
        GameEvent event = GameEvent.of(id, GameEvent.OBSERVATION_HAKI_USED);
        registry.send(gameToken, opponentId, event);
    }

    public void emitArmamentHakiTriggered(String gameToken, UUID attackerId, CounterFireResult counterFire) {
        long id = registry.nextEventId(gameToken);
        Map<String, Object> data = new java.util.HashMap<>();
        data.put("turnSkipped", true);
        if (counterFire != null) {
            data.put("counterFireRow", counterFire.row());
            data.put("counterFireCol", counterFire.col());
            data.put("counterFireResult", counterFire.result().name());
            if (counterFire.sunkShipType() != null) {
                data.put("counterFireSunkShipType", counterFire.sunkShipType());
            }
        }
        GameEvent event = GameEvent.of(id, GameEvent.ARMAMENT_HAKI_TRIGGERED, data);
        registry.send(gameToken, attackerId, event);
    }

    public void emitArmamentHakiDefended(String gameToken, UUID defenderId) {
        long id = registry.nextEventId(gameToken);
        GameEvent event = GameEvent.of(id, "ARMAMENT_HAKI_DEFENDED", Map.of());
        registry.send(gameToken, defenderId, event);
    }

    public void emitConquerorsHakiUsed(String gameToken, UUID opponentId, int skipTurns, String effectLevel) {
        long id = registry.nextEventId(gameToken);
        GameEvent event = GameEvent.of(id, GameEvent.CONQUERORS_HAKI_USED, Map.of(
                "skipTurns", skipTurns,
                "effectLevel", effectLevel
        ));
        registry.send(gameToken, opponentId, event);
    }

    public void emitDeploymentCancelled(String gameToken, UUID opponentId) {
        long id = registry.nextEventId(gameToken);
        GameEvent event = GameEvent.of(id, GameEvent.DEPLOYMENT_CANCELLED, Map.of());
        registry.send(gameToken, opponentId, event);
    }
}
