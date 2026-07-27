package com.last_island.api.infrastructure.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicInteger;

@Component
public class GameMetrics {

    private final Counter shotsFiredCounter;
    private final MeterRegistry meterRegistry;
    private final AtomicInteger sseConnectionsActive = new AtomicInteger(0);

    public GameMetrics(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;

        this.shotsFiredCounter = Counter.builder("shots_fired_total")
                .description("Total number of shots fired")
                .register(meterRegistry);

        meterRegistry.gauge("sse_connections_active", sseConnectionsActive);
    }

    public void incrementShotsFired() {
        shotsFiredCounter.increment();
    }

    public void incrementHakiUsage(String type) {
        Counter.builder("haki_usage_total")
                .tag("type", type)
                .description("Total Haki activations by type")
                .register(meterRegistry)
                .increment();
    }

    public void incrementSseConnections() {
        sseConnectionsActive.incrementAndGet();
    }

    public void decrementSseConnections() {
        sseConnectionsActive.decrementAndGet();
    }
}
