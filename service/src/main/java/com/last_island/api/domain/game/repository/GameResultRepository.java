package com.last_island.api.domain.game.repository;

import com.last_island.api.domain.game.entity.GameResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface GameResultRepository extends JpaRepository<GameResult, UUID> {
}
