package com.last_island.api.domain.game.entity;

import com.last_island.api.common.entity.BaseEntity;
import com.last_island.api.domain.board.entity.Board;
import com.last_island.api.domain.game.enums.GamePhase;
import com.last_island.api.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Duration;
import java.time.LocalDateTime;

@Entity
@Table(name = "games")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class Game extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name = "blue_board_id")
    @ToString.Exclude
    private Board blueBoard;

    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name = "red_board_id")
    @ToString.Exclude
    private Board redBoard;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_turn_id")
    @ToString.Exclude
    private User currentTurn;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GamePhase phase;

    private LocalDateTime startedAt;

    private LocalDateTime endedAt;

    private LocalDateTime turnStartedAt;

    @OneToOne(mappedBy = "game", fetch = FetchType.LAZY)
    @ToString.Exclude
    private GameResult gameResult;

    @Column(unique = true, length = 6)
    private String token;

    public Duration getDuration() {
        if (startedAt == null || endedAt == null) {
            return null;
        }
        return Duration.between(startedAt, endedAt);
    }
}
