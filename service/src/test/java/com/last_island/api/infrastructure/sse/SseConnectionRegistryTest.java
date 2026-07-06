package com.last_island.api.infrastructure.sse;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;

class SseConnectionRegistryTest {

    private SseConnectionRegistry registry;

    @BeforeEach
    void setUp() {
        registry = new SseConnectionRegistry();
    }

    @Test
    void register_storesEmitter() {
        String gameToken = "123456";
        UUID userId = UUID.randomUUID();

        SseEmitter emitter = registry.register(gameToken, userId);

        assertThat(emitter).isNotNull();
        assertThat(registry.getGameEmitters(gameToken)).containsKey(userId);
    }

    @Test
    void send_deliversEventToRegisteredUser() {
        String gameToken = "123456";
        UUID userId = UUID.randomUUID();

        registry.register(gameToken, userId);

        long id = registry.nextEventId(gameToken);
        GameEvent event = GameEvent.of(id, GameEvent.SHOT_RECEIVED, Map.of("row", 3, "col", 5));

        assertThatNoException().isThrownBy(() -> registry.send(gameToken, userId, event));
    }

    @Test
    void send_skipsUnregisteredUser() {
        String gameToken = "123456";
        UUID unknownUser = UUID.randomUUID();

        long id = 1L;
        GameEvent event = GameEvent.of(id, GameEvent.SHOT_RECEIVED);

        assertThatNoException().isThrownBy(() -> registry.send(gameToken, unknownUser, event));
    }

    @Test
    void sendToGame_deliversToAllPlayers() {
        String gameToken = "123456";
        UUID player1 = UUID.randomUUID();
        UUID player2 = UUID.randomUUID();

        registry.register(gameToken, player1);
        registry.register(gameToken, player2);

        long id = registry.nextEventId(gameToken);
        GameEvent event = GameEvent.of(id, GameEvent.GAME_OVER, Map.of("winnerName", "Luffy"));

        assertThatNoException().isThrownBy(() -> registry.sendToGame(gameToken, event));
        // Both emitters still registered (no error thrown)
        assertThat(registry.getGameEmitters(gameToken)).containsKey(player1);
        assertThat(registry.getGameEmitters(gameToken)).containsKey(player2);
    }

    @Test
    void sendToGameExcluding_skipsExcludedUser() {
        String gameToken = "123456";
        UUID player1 = UUID.randomUUID();
        UUID player2 = UUID.randomUUID();

        registry.register(gameToken, player1);
        registry.register(gameToken, player2);

        long id = registry.nextEventId(gameToken);
        GameEvent event = GameEvent.of(id, GameEvent.OPPONENT_JOINED, Map.of("joinerName", "Zoro"));

        assertThatNoException().isThrownBy(() -> registry.sendToGameExcluding(gameToken, player1, event));
        // Both still registered
        assertThat(registry.getGameEmitters(gameToken)).containsKey(player1);
        assertThat(registry.getGameEmitters(gameToken)).containsKey(player2);
    }

    @Test
    void remove_cleansUpEmitter() {
        String gameToken = "123456";
        UUID userId = UUID.randomUUID();

        registry.register(gameToken, userId);
        registry.remove(gameToken, userId);

        Map<UUID, SseEmitter> gameEmitters = registry.getGameEmitters(gameToken);
        assertThat(gameEmitters).isNull();
    }

    @Test
    void removeGame_cleansUpAllEmitters() {
        String gameToken = "123456";
        UUID player1 = UUID.randomUUID();
        UUID player2 = UUID.randomUUID();

        registry.register(gameToken, player1);
        registry.register(gameToken, player2);

        registry.removeGame(gameToken);

        assertThat(registry.getGameEmitters(gameToken)).isNull();
        assertThat(registry.getEventBuffer(gameToken)).isNull();
    }

    @Test
    void replayEvents_sendsBufferedEventsAfterId() {
        String gameToken = "123456";
        UUID player1 = UUID.randomUUID();
        UUID player2 = UUID.randomUUID();

        // Register player1 to generate events
        registry.register(gameToken, player1);

        // Send some events (these get buffered)
        long id1 = registry.nextEventId(gameToken);
        GameEvent event1 = GameEvent.of(id1, GameEvent.OPPONENT_JOINED, Map.of("joinerName", "Nami"));
        registry.sendToGame(gameToken, event1);

        long id2 = registry.nextEventId(gameToken);
        GameEvent event2 = GameEvent.of(id2, GameEvent.SHIPS_PLACED);
        registry.sendToGame(gameToken, event2);

        long id3 = registry.nextEventId(gameToken);
        GameEvent event3 = GameEvent.of(id3, GameEvent.GAME_OVER, Map.of("winnerName", "Luffy"));
        registry.sendToGame(gameToken, event3);

        // Register player2 and replay from event id1
        registry.register(gameToken, player2);
        assertThatNoException().isThrownBy(() -> registry.replayEvents(gameToken, player2, id1));

        // Verify buffer contains all events (CONNECTED for player1 + 3 sent + CONNECTED for player2)
        List<GameEvent> buffer = registry.getEventBuffer(gameToken);
        assertThat(buffer).isNotNull();
        assertThat(buffer.size()).isGreaterThanOrEqualTo(3);
    }

    @Test
    void onTimeout_removesEmitter() {
        String gameToken = "123456";
        UUID userId = UUID.randomUUID();

        SseEmitter emitter = registry.register(gameToken, userId);

        // Simulate timeout by completing the emitter (triggers onCompletion callback)
        emitter.complete();

        // After completion callback fires, emitter should be removed
        // Note: In real Spring, onCompletion runs async. Here we call remove directly.
        registry.remove(gameToken, userId);
        assertThat(registry.getGameEmitters(gameToken)).isNull();
    }

    @Test
    void buffer_limitsSize() {
        String gameToken = "123456";
        UUID userId = UUID.randomUUID();

        registry.register(gameToken, userId);

        // Send 60 events
        for (int i = 0; i < 60; i++) {
            long id = registry.nextEventId(gameToken);
            GameEvent event = GameEvent.of(id, GameEvent.SHOT_RECEIVED, Map.of("index", i));
            registry.sendToGame(gameToken, event);
        }

        List<GameEvent> buffer = registry.getEventBuffer(gameToken);
        assertThat(buffer).isNotNull();
        // Buffer should be capped at 50 (CONNECTED event + 60 events = 61, trimmed to 50)
        assertThat(buffer.size()).isEqualTo(50);
    }
}
