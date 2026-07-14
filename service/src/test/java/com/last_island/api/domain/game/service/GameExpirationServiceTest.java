package com.last_island.api.domain.game.service;

import com.last_island.api.domain.board.entity.Board;
import com.last_island.api.domain.game.entity.Game;
import com.last_island.api.domain.game.enums.GamePhase;
import com.last_island.api.domain.game.repository.GameRepository;
import com.last_island.api.domain.user.entity.User;
import com.last_island.api.domain.user.enums.Filiation;
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
        bluePlayer = buildUser("Luffy", Filiation.PIRATE);
        redPlayer = buildUser("Akainu", Filiation.MARINE);
    }

    @Test
    void checkExpirations_turnExpired_switchesTurnToOpponent() {
        // Given: a game with turn started 121 seconds ago
        Game game = buildInProgressGame();
        game.setCurrentTurn(bluePlayer);
        game.setTurnStartedAt(LocalDateTime.now().minusSeconds(121));

        when(gameRepository.findExpiredGames(any())).thenReturn(Collections.emptyList());
        when(gameRepository.findGamesWithExpiredTurns(any())).thenReturn(List.of(game));

        // When
        gameExpirationService.checkExpirations();

        // Then
        verify(gameRepository).save(game);
        assertThat(game.getCurrentTurn()).isEqualTo(redPlayer);
        assertThat(game.getTurnStartedAt()).isAfter(LocalDateTime.now().minusSeconds(5));
    }

    @Test
    void checkExpirations_gameExpired_setsPhaseToCancel() {
        // Given: a game started 31 minutes ago
        Game game = buildInProgressGame();
        game.setStartedAt(LocalDateTime.now().minusMinutes(31));
        game.setTurnStartedAt(LocalDateTime.now().minusSeconds(60));

        when(gameRepository.findExpiredGames(any())).thenReturn(List.of(game));
        when(gameRepository.findGamesWithExpiredTurns(any())).thenReturn(Collections.emptyList());

        // When
        gameExpirationService.checkExpirations();

        // Then
        verify(gameRepository).save(game);
        assertThat(game.getPhase()).isEqualTo(GamePhase.CANCELLED);
        assertThat(game.getEndedAt()).isNotNull();
    }

    @Test
    void checkExpirations_noExpiredGames_doesNothing() {
        // Given: no expired games or turns
        when(gameRepository.findExpiredGames(any())).thenReturn(Collections.emptyList());
        when(gameRepository.findGamesWithExpiredTurns(any())).thenReturn(Collections.emptyList());

        // When
        gameExpirationService.checkExpirations();

        // Then
        verify(gameRepository, never()).save(any());
        verifyNoInteractions(gameEventEmitter);
    }

    @Test
    void checkExpirations_gameInBothQueries_onlyCancelsGame() {
        // Given: a game that appears in both expired-game and expired-turn queries
        Game game = buildInProgressGame();
        game.setStartedAt(LocalDateTime.now().minusMinutes(31));
        game.setCurrentTurn(bluePlayer);
        game.setTurnStartedAt(LocalDateTime.now().minusSeconds(121));

        when(gameRepository.findExpiredGames(any())).thenReturn(List.of(game));
        when(gameRepository.findGamesWithExpiredTurns(any())).thenReturn(List.of(game));

        // When
        gameExpirationService.checkExpirations();

        // Then: game is cancelled, NOT turn-switched
        assertThat(game.getPhase()).isEqualTo(GamePhase.CANCELLED);
        assertThat(game.getEndedAt()).isNotNull();
        // currentTurn should remain as bluePlayer (no switch)
        assertThat(game.getCurrentTurn()).isEqualTo(bluePlayer);
        // save called once for game expiration only
        verify(gameRepository, times(1)).save(game);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private User buildUser(String name, Filiation filiation) {
        User user = User.builder()
                .name(name)
                .email(name.toLowerCase() + "@test.com")
                .passwordHash("hashed")
                .filiation(filiation)
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
        game.setStartedAt(LocalDateTime.now().minusMinutes(10));
        game.setTurnStartedAt(LocalDateTime.now().minusSeconds(60));

        return game;
    }
}
