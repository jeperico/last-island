package com.last_island.api.infrastructure.metrics;

import com.last_island.api.domain.game.enums.GamePhase;
import com.last_island.api.domain.game.repository.GameRepository;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GameMetricsConfig {

    public GameMetricsConfig(MeterRegistry meterRegistry, GameRepository gameRepository) {
        Gauge.builder("active_games", () -> gameRepository.countByPhaseAndIsActiveTrue(GamePhase.IN_PROGRESS))
                .description("Number of games currently in progress")
                .register(meterRegistry);
    }
}
