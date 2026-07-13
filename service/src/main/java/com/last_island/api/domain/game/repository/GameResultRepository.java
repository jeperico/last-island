package com.last_island.api.domain.game.repository;

import com.last_island.api.domain.game.entity.GameResult;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface GameResultRepository extends JpaRepository<GameResult, UUID> {

    @Query("""
        SELECT gr FROM GameResult gr
        JOIN FETCH gr.game g
        JOIN FETCH gr.winner
        JOIN FETCH gr.loser
        JOIN FETCH g.blueBoard bb
        JOIN FETCH bb.owner
        LEFT JOIN FETCH g.redBoard rb
        LEFT JOIN FETCH rb.owner
        WHERE gr.winner.id = :userId OR gr.loser.id = :userId
        ORDER BY g.endedAt DESC
    """)
    List<GameResult> findTop10ByUserIdOrderByEndedAtDesc(@Param("userId") UUID userId, Pageable pageable);
}
