package com.last_island.api.domain.game.service;

import com.last_island.api.domain.board.entity.Board;
import com.last_island.api.domain.game.entity.Game;
import com.last_island.api.domain.game.enums.GamePhase;
import com.last_island.api.domain.game.repository.GameRepository;
import com.last_island.api.domain.user.entity.User;
import com.last_island.api.infrastructure.sse.GameEventEmitter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GameExpirationServiceTest {

    @Mock
    private GameRepository gameRepository;

    @Mock
    private GameEventEmitter gameEventEmitter;

    @InjectMocks
    private GameExpirationService gameExpirationService;

    private User bluePlayer;
    private User redPlayer;

    @BeforeEach
    void setUp() {
        bluePlayer = buildUser("Luffy");
        redPlayer = buildUser("Zoro");
    }

    @Test
    void checkExpirations_turnExpired_skipsTurnToOpponent() {
        // Given: a game with turn started 21 seconds ago (blue's turn)
        Game game = buildInProgressGame();
        game.setCurrentTurn(bluePlayer);
        game.setTurnStartedAt(LocalDateTime.now().minusSeconds(21));

        when(gameRepository.findGamesWithExpiredTurns(any())).thenReturn(List.of(game));
        when(gameRepository.findExpiredPlacingShipsGames(any())).thenReturn(Collections.emptyList());

        // When
        gameExpirationService.checkExpirations();

        // Then: turn is skipped to red, game is still IN_PROGRESS
        verify(gameRepository).save(game);
        assertThat(game.getPhase()).isEqualTo(GamePhase.IN_PROGRESS);
        assertThat(game.getCurrentTurn()).isEqualTo(redPlayer);
        assertThat(game.getTurnStartedAt()).isAfter(LocalDateTime.now().minusSeconds(2));
    }

    @Test
    void checkExpirations_noExpiredGames_doesNothing() {
        // Given: no expired turns
        when(gameRepository.findGamesWithExpiredTurns(any())).thenReturn(Collections.emptyList());
        when(gameRepository.findExpiredPlacingShipsGames(any())).thenReturn(Collections.emptyList());

        // When
        gameExpirationService.checkExpirations();

        // Then
        verify(gameRepository, never()).save(any());
        verifyNoInteractions(gameEventEmitter);
    }

    @Test
    void checkExpirations_placingShipsExpired_setsPhaseToCancel() {
        // Given: a game in PLACING_SHIPS phase with updatedAt 6 minutes ago
        Board blueBoard = Board.builder()
                .owner(bluePlayer)
                .ships(new ArrayList<>())
                .shots(new ArrayList<>())
                .build();
        blueBoard.setId(UUID.randomUUID());

        Board redBoard = Board.builder()
                .owner(redPlayer)
                .ships(new ArrayList<>())
                .shots(new ArrayList<>())
                .build();
        redBoard.setId(UUID.randomUUID());

        Game game = Game.builder()
                .blueBoard(blueBoard)
                .redBoard(redBoard)
                .phase(GamePhase.PLACING_SHIPS)
                .token("PLACING1")
                .build();
        game.setId(UUID.randomUUID());
        game.setUpdatedAt(LocalDateTime.now().minusMinutes(6));

        when(gameRepository.findExpiredPlacingShipsGames(any())).thenReturn(List.of(game));
        when(gameRepository.findGamesWithExpiredTurns(any())).thenReturn(Collections.emptyList());

        // When
        gameExpirationService.checkExpirations();

        // Then
        verify(gameRepository).save(game);
        assertThat(game.getPhase()).isEqualTo(GamePhase.CANCELLED);
        assertThat(game.getEndedAt()).isNotNull();
    }

    @Test
    void handleTurnExpiration_turnNotExpired_doesNotSwitch() {
        // Given: a game with turn started only 5 seconds ago
        Game game = buildInProgressGame();
        game.setCurrentTurn(bluePlayer);
        game.setTurnStartedAt(LocalDateTime.now().minusSeconds(5));

        LocalDateTime turnDeadline = LocalDateTime.now().minusSeconds(20);

        // When
        gameExpirationService.handleTurnExpiration(game, turnDeadline);

        // Then: no save, no turn switch
        verify(gameRepository, never()).save(any());
        assertThat(game.getCurrentTurn()).isEqualTo(bluePlayer);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private User buildUser(String name) {
        User user = User.builder()
                .name(name)
                .email(name.toLowerCase() + "@test.com")
                .passwordHash("hashed")
                .wins(0)
                .losses(0)
                .totalShots(0)
                .totalHits(0)
                .build();
        user.setId(UUID.randomUUID());
        return user;
    }

    private Game buildInProgressGame() {
        Board blueBoard = Board.builder()
                .owner(bluePlayer)
                .ships(new ArrayList<>())
                .shots(new ArrayList<>())
                .build();
        blueBoard.setId(UUID.randomUUID());

        Board redBoard = Board.builder()
                .owner(redPlayer)
                .ships(new ArrayList<>())
                .shots(new ArrayList<>())
                .build();
        redBoard.setId(UUID.randomUUID());

        Game game = Game.builder()
                .blueBoard(blueBoard)
                .redBoard(redBoard)
                .currentTurn(bluePlayer)
                .phase(GamePhase.IN_PROGRESS)
                .token("ABC123")
                .build();
        game.setId(UUID.randomUUID());
        game.setStartedAt(LocalDateTime.now().minusMinutes(2));
        game.setTurnStartedAt(LocalDateTime.now().minusSeconds(30));

        return game;
    }
}
