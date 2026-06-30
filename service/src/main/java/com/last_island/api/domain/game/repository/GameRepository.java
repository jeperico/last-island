package com.last_island.api.domain.game.repository;

import com.last_island.api.domain.game.entity.Game;
import com.last_island.api.domain.game.enums.GamePhase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface GameRepository extends JpaRepository<Game, UUID> {

    @Query("SELECT g FROM Game g LEFT JOIN FETCH g.blueBoard bb LEFT JOIN FETCH bb.owner LEFT JOIN FETCH g.redBoard rb LEFT JOIN FETCH rb.owner WHERE g.token = :token AND g.isActive = true")
    Optional<Game> findByTokenAndIsActiveTrue(@Param("token") String token);

    Page<Game> findByPhaseAndIsActiveTrue(GamePhase phase, Pageable pageable);

    boolean existsByToken(String token);

    @Query("SELECT COUNT(g) > 0 FROM Game g WHERE g.isActive = true AND g.phase <> com.last_island.api.domain.game.enums.GamePhase.FINISHED AND (g.blueBoard.owner.id = :userId OR g.redBoard.owner.id = :userId)")
    boolean hasActiveGame(@Param("userId") UUID userId);
}
