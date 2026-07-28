package com.last_island.api.infrastructure.sse;

import com.last_island.api.infrastructure.metrics.GameMetrics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LobbySseRegistryTest {

    @Mock
    private GameMetrics gameMetrics;

    private LobbySseRegistry registry;

    @BeforeEach
    void setUp() {
        registry = new LobbySseRegistry(gameMetrics);
    }

    @Test
    void register_storesEmitter() {
        UUID userId = UUID.randomUUID();

        SseEmitter emitter = registry.register(userId);

        assertThat(emitter).isNotNull();
        assertThat(registry.getEmitters()).containsKey(userId);
    }

    @Test
    void register_sameUserTwice_completesOldEmitter() {
        UUID userId = UUID.randomUUID();

        registry.register(userId);
        registry.register(userId);

        // Increment called twice (once per register), decrement called once (old emitter cleanup)
        verify(gameMetrics, times(2)).incrementSseConnections();
        verify(gameMetrics, times(1)).decrementSseConnections();

        // Only one emitter remains in the map
        assertThat(registry.getEmitters()).hasSize(1);
        assertThat(registry.getEmitters()).containsKey(userId);
    }

    @Test
    void remove_decrementsCounter() {
        UUID userId = UUID.randomUUID();

        registry.register(userId);
        registry.remove(userId);

        verify(gameMetrics, times(1)).incrementSseConnections();
        verify(gameMetrics, times(1)).decrementSseConnections();
        assertThat(registry.getEmitters()).doesNotContainKey(userId);
    }

    @Test
    void remove_nonExistentUser_doesNotDecrement() {
        UUID userId = UUID.randomUUID();

        registry.remove(userId);

        verify(gameMetrics, never()).decrementSseConnections();
    }
}
