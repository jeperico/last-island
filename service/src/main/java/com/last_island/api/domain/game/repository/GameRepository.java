package com.last_island.api.domain.game.repository;

import com.last_island.api.domain.game.entity.Game;
import com.last_island.api.domain.game.enums.GamePhase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GameRepository extends JpaRepository<Game, UUID> {

    @Query("SELECT g FROM Game g LEFT JOIN FETCH g.blueBoard bb LEFT JOIN FETCH bb.owner LEFT JOIN FETCH g.redBoard rb LEFT JOIN FETCH rb.owner WHERE g.token = :token AND g.isActive = true")
    Optional<Game> findByTokenAndIsActiveTrue(@Param("token") String token);

    Page<Game> findByPhaseAndIsActiveTrue(GamePhase phase, Pageable pageable);

    boolean existsByToken(String token);

    @Query("SELECT g FROM Game g JOIN FETCH g.blueBoard bb JOIN FETCH bb.owner JOIN FETCH g.redBoard rb JOIN FETCH rb.owner JOIN FETCH g.currentTurn WHERE g.phase = 'IN_PROGRESS' AND g.isActive = true AND g.turnStartedAt < :turnDeadline")
    List<Game> findGamesWithExpiredTurns(@Param("turnDeadline") LocalDateTime turnDeadline);

    @Query("SELECT g FROM Game g WHERE g.phase = 'IN_PROGRESS' AND g.isActive = true AND g.startedAt < :gameDeadline")
    List<Game> findExpiredGames(@Param("gameDeadline") LocalDateTime gameDeadline);

    @Query("SELECT g FROM Game g WHERE g.phase = 'PLACING_SHIPS' AND g.isActive = true AND g.updatedAt < :placingDeadline")
    List<Game> findExpiredPlacingShipsGames(@Param("placingDeadline") LocalDateTime placingDeadline);

    long countByPhaseAndIsActiveTrue(GamePhase phase);
}
