package com.last_island.api.infrastructure.sse;

import com.last_island.api.infrastructure.metrics.GameMetrics;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class SseConnectionRegistry {

    private static final long EMITTER_TIMEOUT = 300_000L;
    private static final int MAX_BUFFER_SIZE = 50;

    private final ConcurrentHashMap<String, Map<UUID, SseEmitter>> emitters = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, List<GameEvent>> eventBuffers = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, AtomicLong> eventCounters = new ConcurrentHashMap<>();
    private final GameMetrics gameMetrics;

    public SseConnectionRegistry(GameMetrics gameMetrics) {
        this.gameMetrics = gameMetrics;
    }

    public SseEmitter register(String gameToken, UUID userId) {
        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT);

        Map<UUID, SseEmitter> gameEmitters = emitters.computeIfAbsent(gameToken, k -> new ConcurrentHashMap<>());

        // Complete old emitter before replacing to keep the counter accurate
        SseEmitter oldEmitter = gameEmitters.get(userId);
        if (oldEmitter != null) {
            gameEmitters.remove(userId);
            gameMetrics.decrementSseConnections();
            try {
                oldEmitter.complete();
            } catch (IllegalStateException e) {
                // Already completed — safe to ignore
            }
        }

        gameEmitters.put(userId, emitter);
        eventCounters.computeIfAbsent(gameToken, k -> new AtomicLong(0));
        eventBuffers.computeIfAbsent(gameToken, k -> Collections.synchronizedList(new ArrayList<>()));

        final SseEmitter thisEmitter = emitter;
        emitter.onCompletion(() -> {
            if (gameEmitters.get(userId) == thisEmitter) {
                remove(gameToken, userId);
            }
        });
        emitter.onTimeout(() -> {
            if (gameEmitters.get(userId) == thisEmitter) {
                remove(gameToken, userId);
            }
        });
        emitter.onError(e -> {
            if (gameEmitters.get(userId) == thisEmitter) {
                remove(gameToken, userId);
            }
        });

        // Send CONNECTED event immediately
        long id = eventCounters.get(gameToken).incrementAndGet();
        GameEvent connectedEvent = GameEvent.of(id, GameEvent.CONNECTED);
        doSend(emitter, connectedEvent);
        bufferEvent(gameToken, connectedEvent);

        gameMetrics.incrementSseConnections();

        return emitter;
    }

    public void send(String gameToken, UUID targetUserId, GameEvent event) {
        Map<UUID, SseEmitter> gameEmitters = emitters.get(gameToken);
        if (gameEmitters == null) return;

        SseEmitter emitter = gameEmitters.get(targetUserId);
        if (emitter == null) return;

        doSend(emitter, event);
        bufferEvent(gameToken, event);
    }

    public void sendToGame(String gameToken, GameEvent event) {
        Map<UUID, SseEmitter> gameEmitters = emitters.get(gameToken);
        if (gameEmitters == null) return;

        for (SseEmitter emitter : gameEmitters.values()) {
            doSend(emitter, event);
        }
        bufferEvent(gameToken, event);
    }

    public void sendToGameExcluding(String gameToken, UUID excludeUserId, GameEvent event) {
        Map<UUID, SseEmitter> gameEmitters = emitters.get(gameToken);
        if (gameEmitters == null) return;

        for (Map.Entry<UUID, SseEmitter> entry : gameEmitters.entrySet()) {
            if (!entry.getKey().equals(excludeUserId)) {
                doSend(entry.getValue(), event);
            }
        }
        bufferEvent(gameToken, event);
    }

    public void remove(String gameToken, UUID userId) {
        Map<UUID, SseEmitter> gameEmitters = emitters.get(gameToken);
        if (gameEmitters != null) {
            SseEmitter removed = gameEmitters.remove(userId);
            if (removed != null) {
                gameMetrics.decrementSseConnections();
            }
            if (gameEmitters.isEmpty()) {
                emitters.remove(gameToken);
            }
        }
    }

    public void removeGame(String gameToken) {
        Map<UUID, SseEmitter> gameEmitters = emitters.remove(gameToken);
        if (gameEmitters != null) {
            for (SseEmitter emitter : gameEmitters.values()) {
                gameMetrics.decrementSseConnections();
                try {
                    emitter.complete();
                } catch (IllegalStateException e) {
                    // Already completed — safe to ignore
                }
            }
        }
        eventBuffers.remove(gameToken);
        eventCounters.remove(gameToken);
    }

    public void sendHeartbeatToAll() {
        for (Map<UUID, SseEmitter> gameEmitters : emitters.values()) {
            for (SseEmitter emitter : gameEmitters.values()) {
                synchronized (emitter) {
                    try {
                        emitter.send(SseEmitter.event().comment("heartbeat"));
                    } catch (IOException | IllegalStateException e) {
                        // Broken emitter — will be cleaned up by callbacks
                    }
                }
            }
        }
    }

    public void replayEvents(String gameToken, UUID userId, long lastEventId) {
        List<GameEvent> buffer = eventBuffers.get(gameToken);
        if (buffer == null) return;

        Map<UUID, SseEmitter> gameEmitters = emitters.get(gameToken);
        if (gameEmitters == null) return;

        SseEmitter emitter = gameEmitters.get(userId);
        if (emitter == null) return;

        List<GameEvent> snapshot;
        synchronized (buffer) {
            snapshot = new ArrayList<>(buffer);
        }

        for (GameEvent event : snapshot) {
            if (event.id() > lastEventId) {
                doSend(emitter, event);
            }
        }
    }

    public long nextEventId(String gameToken) {
        return eventCounters.computeIfAbsent(gameToken, k -> new AtomicLong(0)).incrementAndGet();
    }

    // Visible for testing
    Map<UUID, SseEmitter> getGameEmitters(String gameToken) {
        return emitters.get(gameToken);
    }

    // Visible for testing
    List<GameEvent> getEventBuffer(String gameToken) {
        return eventBuffers.get(gameToken);
    }

    private void doSend(SseEmitter emitter, GameEvent event) {
        synchronized (emitter) {
            try {
                emitter.send(SseEmitter.event()
                        .id(String.valueOf(event.id()))
                        .name(event.type())
                        .data(event.data()));
            } catch (IOException | IllegalStateException e) {
                // Emitter is closed or broken — will be cleaned up by callbacks
            }
        }
    }

    private void bufferEvent(String gameToken, GameEvent event) {
        List<GameEvent> buffer = eventBuffers.computeIfAbsent(gameToken, k -> Collections.synchronizedList(new ArrayList<>()));
        synchronized (buffer) {
            buffer.add(event);
            while (buffer.size() > MAX_BUFFER_SIZE) {
                buffer.removeFirst();
            }
        }
    }
}
