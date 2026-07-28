package com.last_island.api.infrastructure.sse;

import com.last_island.api.infrastructure.metrics.GameMetrics;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class LobbySseRegistry {

    private static final long EMITTER_TIMEOUT = 300_000L;

    private final ConcurrentHashMap<UUID, SseEmitter> emitters = new ConcurrentHashMap<>();
    private final GameMetrics gameMetrics;

    public LobbySseRegistry(GameMetrics gameMetrics) {
        this.gameMetrics = gameMetrics;
    }

    public SseEmitter register(UUID userId) {
        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT);

        // Complete old emitter before replacing to keep the counter accurate
        SseEmitter oldEmitter = emitters.get(userId);
        if (oldEmitter != null) {
            emitters.remove(userId);
            gameMetrics.decrementSseConnections();
            try {
                oldEmitter.complete();
            } catch (IllegalStateException e) {
                // Already completed — safe to ignore
            }
        }

        emitters.put(userId, emitter);

        final SseEmitter thisEmitter = emitter;
        emitter.onCompletion(() -> {
            if (emitters.get(userId) == thisEmitter) {
                remove(userId);
            }
        });
        emitter.onTimeout(() -> {
            if (emitters.get(userId) == thisEmitter) {
                remove(userId);
            }
        });
        emitter.onError(e -> {
            if (emitters.get(userId) == thisEmitter) {
                remove(userId);
            }
        });

        // Send LOBBY_CONNECTED event immediately
        LobbyEvent connectedEvent = LobbyEvent.of(LobbyEvent.LOBBY_CONNECTED);
        doSend(emitter, connectedEvent);

        gameMetrics.incrementSseConnections();

        return emitter;
    }

    public void broadcast(LobbyEvent event) {
        for (Map.Entry<UUID, SseEmitter> entry : emitters.entrySet()) {
            doSend(entry.getValue(), event);
        }
    }

    public void remove(UUID userId) {
        SseEmitter removed = emitters.remove(userId);
        if (removed != null) {
            gameMetrics.decrementSseConnections();
        }
    }

    public void sendHeartbeatToAll() {
        for (SseEmitter emitter : emitters.values()) {
            synchronized (emitter) {
                try {
                    emitter.send(SseEmitter.event().comment("heartbeat"));
                } catch (IOException | IllegalStateException e) {
                    // Broken emitter — will be cleaned up by callbacks
                }
            }
        }
    }

    // Visible for testing
    Map<UUID, SseEmitter> getEmitters() {
        return emitters;
    }

    private void doSend(SseEmitter emitter, LobbyEvent event) {
        synchronized (emitter) {
            try {
                emitter.send(SseEmitter.event()
                        .name(event.type())
                        .data(event.data()));
            } catch (IOException | IllegalStateException e) {
                // Emitter is closed or broken — will be cleaned up by callbacks
            }
        }
    }
}
