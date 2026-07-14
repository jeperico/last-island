package com.last_island.api.infrastructure.sse;

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

    public SseEmitter register(UUID userId) {
        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT);

        emitters.put(userId, emitter);

        emitter.onCompletion(() -> remove(userId));
        emitter.onTimeout(() -> remove(userId));
        emitter.onError(e -> remove(userId));

        // Send LOBBY_CONNECTED event immediately
        LobbyEvent connectedEvent = LobbyEvent.of(LobbyEvent.LOBBY_CONNECTED);
        doSend(emitter, connectedEvent);

        return emitter;
    }

    public void broadcast(LobbyEvent event) {
        for (Map.Entry<UUID, SseEmitter> entry : emitters.entrySet()) {
            doSend(entry.getValue(), event);
        }
    }

    public void remove(UUID userId) {
        emitters.remove(userId);
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
