package com.last_island.api.infrastructure.sse;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class SseHeartbeatSchedulerTest {

    @Mock
    private SseConnectionRegistry sseConnectionRegistry;

    @Mock
    private LobbySseRegistry lobbySseRegistry;

    @InjectMocks
    private SseHeartbeatScheduler scheduler;

    @Test
    void sendHeartbeat_callsBothRegistries() {
        scheduler.sendHeartbeat();

        verify(sseConnectionRegistry).sendHeartbeatToAll();
        verify(lobbySseRegistry).sendHeartbeatToAll();
    }
}
