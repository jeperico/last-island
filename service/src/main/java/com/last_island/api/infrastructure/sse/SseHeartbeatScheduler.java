package com.last_island.api.infrastructure.sse;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class SseHeartbeatScheduler {

    private final SseConnectionRegistry sseConnectionRegistry;
    private final LobbySseRegistry lobbySseRegistry;

    public SseHeartbeatScheduler(SseConnectionRegistry sseConnectionRegistry, LobbySseRegistry lobbySseRegistry) {
        this.sseConnectionRegistry = sseConnectionRegistry;
        this.lobbySseRegistry = lobbySseRegistry;
    }

    @Scheduled(fixedRate = 15000)
    public void sendHeartbeat() {
        sseConnectionRegistry.sendHeartbeatToAll();
        lobbySseRegistry.sendHeartbeatToAll();
    }
}
