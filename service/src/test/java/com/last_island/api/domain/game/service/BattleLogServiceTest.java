package com.last_island.api.domain.game.service;

import com.last_island.api.domain.board.entity.Board;
import com.last_island.api.domain.board.entity.Ship;
import com.last_island.api.domain.board.entity.Shot;
import com.last_island.api.domain.board.enums.Orientation;
import com.last_island.api.domain.board.enums.ShipType;
import com.last_island.api.domain.board.enums.ShotResult;
import com.last_island.api.domain.game.dto.BattleLogEntryResponse;
import com.last_island.api.domain.game.entity.Game;
import com.last_island.api.domain.game.entity.GameResult;
import com.last_island.api.domain.game.enums.GamePhase;
import com.last_island.api.domain.game.repository.GameResultRepository;
import com.last_island.api.domain.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BattleLogServiceTest {

    @Mock
    private GameResultRepository gameResultRepository;

    @InjectMocks
    private BattleLogService battleLogService;

    private User bluePlayer;
    private User redPlayer;

    @BeforeEach
    void setUp() {
        bluePlayer = buildUser("Luffy");
        redPlayer = buildUser("Zoro");
    }

    @Test
    void getBattleLog_victory_returnsCorrectMapping() {
        Game game = buildFinishedGame();
        GameResult result = GameResult.builder()
                .game(game)
                .winner(bluePlayer)
                .loser(redPlayer)
                .turns(20)
                .build();
        result.setId(UUID.randomUUID());

        when(gameResultRepository.findTop10ByUserIdOrderByEndedAtDesc(eq(bluePlayer.getId()), any(PageRequest.class)))
                .thenReturn(List.of(result));

        List<BattleLogEntryResponse> log = battleLogService.getBattleLog(bluePlayer.getId());

        assertThat(log).hasSize(1);
        BattleLogEntryResponse entry = log.get(0);
        assertThat(entry.gameId()).isEqualTo(game.getId());
        assertThat(entry.opponentName()).isEqualTo("Zoro");
        assertThat(entry.result()).isEqualTo("VICTORY");
        assertThat(entry.shotsFired()).isEqualTo(3); // shots on opponent's (red) board
        assertThat(entry.shipsSunk()).isEqualTo(1); // one sunk ship on opponent's board
        assertThat(entry.duration()).isEqualTo("5m 30s");
        assertThat(entry.date()).isNotNull();
    }

    @Test
    void getBattleLog_defeat_returnsCorrectMapping() {
        Game game = buildFinishedGame();
        GameResult result = GameResult.builder()
                .game(game)
                .winner(bluePlayer)
                .loser(redPlayer)
                .turns(20)
                .build();
        result.setId(UUID.randomUUID());

        when(gameResultRepository.findTop10ByUserIdOrderByEndedAtDesc(eq(redPlayer.getId()), any(PageRequest.class)))
                .thenReturn(List.of(result));

        List<BattleLogEntryResponse> log = battleLogService.getBattleLog(redPlayer.getId());

        assertThat(log).hasSize(1);
        BattleLogEntryResponse entry = log.get(0);
        assertThat(entry.opponentName()).isEqualTo("Luffy");
        assertThat(entry.result()).isEqualTo("DEFEAT");
        assertThat(entry.shotsFired()).isEqualTo(2); // shots on blue board (opponent's board when user is red)
        assertThat(entry.shipsSunk()).isEqualTo(0); // no sunk ships on blue board
    }

    @Test
    void getBattleLog_emptyList_returnsEmpty() {
        UUID userId = UUID.randomUUID();
        when(gameResultRepository.findTop10ByUserIdOrderByEndedAtDesc(eq(userId), any(PageRequest.class)))
                .thenReturn(Collections.emptyList());

        List<BattleLogEntryResponse> log = battleLogService.getBattleLog(userId);

        assertThat(log).isEmpty();
    }

    // --- Helper methods ---

    private User buildUser(String name) {
        User user = User.builder()
                .name(name)
                .email(name.toLowerCase() + "@test.com")
                .passwordHash("hashed")
                .rank("Rookie")
                .build();
        user.setId(UUID.randomUUID());
        return user;
    }

    private Game buildFinishedGame() {
        // Blue board: 2 shots received, no ships sunk
        Board blueBoard = Board.builder()
                .owner(bluePlayer)
                .ships(new ArrayList<>(List.of(
                        buildShip(ShipType.THOUSAND_SUNNY, 0)
                )))
                .shots(new ArrayList<>(List.of(
                        buildShot(0, 0, ShotResult.MISS),
                        buildShot(1, 1, ShotResult.MISS)
                )))
                .build();
        blueBoard.setId(UUID.randomUUID());

        // Red board: 3 shots received, 1 ship sunk
        Ship sunkShip = buildShip(ShipType.STRIKER, 2); // size 2, hits 2 → sunk
        Ship aliveShip = buildShip(ShipType.THOUSAND_SUNNY, 0); // size 5, hits 0 → not sunk
        Board redBoard = Board.builder()
                .owner(redPlayer)
                .ships(new ArrayList<>(List.of(sunkShip, aliveShip)))
                .shots(new ArrayList<>(List.of(
                        buildShot(0, 0, ShotResult.HIT),
                        buildShot(0, 1, ShotResult.HIT),
                        buildShot(2, 2, ShotResult.MISS)
                )))
                .build();
        redBoard.setId(UUID.randomUUID());

        LocalDateTime startedAt = LocalDateTime.of(2026, 7, 13, 10, 0, 0);
        LocalDateTime endedAt = LocalDateTime.of(2026, 7, 13, 10, 5, 30);

        Game game = Game.builder()
                .blueBoard(blueBoard)
                .redBoard(redBoard)
                .phase(GamePhase.FINISHED)
                .startedAt(startedAt)
                .endedAt(endedAt)
                .token("ABC123")
                .build();
        game.setId(UUID.randomUUID());

        return game;
    }

    private Ship buildShip(ShipType type, int hits) {
        return Ship.builder()
                .type(type)
                .orientation(Orientation.HORIZONTAL)
                .row(0)
                .col(0)
                .hits(hits)
                .build();
    }

    private Shot buildShot(int row, int col, ShotResult result) {
        return Shot.builder()
                .row(row)
                .col(col)
                .result(result)
                .build();
    }
}
