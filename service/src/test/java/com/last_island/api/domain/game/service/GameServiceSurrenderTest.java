package com.last_island.api.domain.game.service;

import com.last_island.api.domain.board.entity.Board;
import com.last_island.api.domain.game.entity.Game;
import com.last_island.api.domain.game.entity.GameResult;
import com.last_island.api.domain.game.enums.GamePhase;
import com.last_island.api.domain.game.repository.GameRepository;
import com.last_island.api.domain.game.repository.GameResultRepository;
import com.last_island.api.domain.user.entity.User;
import com.last_island.api.domain.user.repository.UserRepository;
import com.last_island.api.domain.user.service.BountyService;
import com.last_island.api.infrastructure.sse.GameEventEmitter;
import com.last_island.api.infrastructure.sse.LobbyEventEmitter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GameServiceSurrenderTest {

    @Mock
    private GameRepository gameRepository;

    @Mock
    private GameResultRepository gameResultRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private GameEventEmitter gameEventEmitter;

    @Mock
    private LobbyEventEmitter lobbyEventEmitter;

    @Mock
    private BountyService bountyService;

    @InjectMocks
    private GameService gameService;

    private User bluePlayer;
    private User redPlayer;

    @BeforeEach
    void setUp() {
        bluePlayer = buildUser("Luffy");
        redPlayer = buildUser("Zoro");
    }

    // --- Helper methods ---

    private User buildUser(String name) {
        User user = User.builder()
                .name(name)
                .email(name.toLowerCase() + "@test.com")
                .passwordHash("hashed")
                .rank("Rookie")
                .wins(0)
                .losses(0)
                .build();
        user.setId(UUID.randomUUID());
        return user;
    }

    private Game buildPlacingShipsGame() {
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
                .currentTurn(bluePlayer)
                .token("123456")
                .build();
        game.setId(UUID.randomUUID());
        return game;
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
                .phase(GamePhase.IN_PROGRESS)
                .currentTurn(bluePlayer)
                .token("654321")
                .build();
        game.setId(UUID.randomUUID());
        return game;
    }

    // --- Happy path tests ---

    @Test
    void surrender_inProgressGame_bluePlayerLoses() {
        Game game = buildInProgressGame();
        when(gameRepository.findByTokenAndIsActiveTrue("654321")).thenReturn(Optional.of(game));

        gameService.surrender("654321", bluePlayer.getId());

        assertThat(game.getPhase()).isEqualTo(GamePhase.FINISHED);
        assertThat(game.getEndedAt()).isNotNull();
        verify(gameRepository).save(game);

        ArgumentCaptor<GameResult> resultCaptor = ArgumentCaptor.forClass(GameResult.class);
        verify(gameResultRepository).save(resultCaptor.capture());
        GameResult result = resultCaptor.getValue();
        assertThat(result.getWinner()).isEqualTo(redPlayer);
        assertThat(result.getLoser()).isEqualTo(bluePlayer);
    }

    @Test
    void surrender_inProgressGame_redPlayerLoses() {
        Game game = buildInProgressGame();
        when(gameRepository.findByTokenAndIsActiveTrue("654321")).thenReturn(Optional.of(game));

        gameService.surrender("654321", redPlayer.getId());

        assertThat(game.getPhase()).isEqualTo(GamePhase.FINISHED);

        ArgumentCaptor<GameResult> resultCaptor = ArgumentCaptor.forClass(GameResult.class);
        verify(gameResultRepository).save(resultCaptor.capture());
        GameResult result = resultCaptor.getValue();
        assertThat(result.getWinner()).isEqualTo(bluePlayer);
        assertThat(result.getLoser()).isEqualTo(redPlayer);
    }

    @Test
    void surrender_placingShipsGame_cancelsWithoutLoss() {
        Game game = buildPlacingShipsGame();
        when(gameRepository.findByTokenAndIsActiveTrue("123456")).thenReturn(Optional.of(game));

        gameService.surrender("123456", bluePlayer.getId());

        assertThat(game.getPhase()).isEqualTo(GamePhase.CANCELLED);
        assertThat(game.getEndedAt()).isNotNull();

        // No GameResult created — no win/loss recorded
        verify(gameResultRepository, never()).save(any());
    }

    @Test
    void surrender_updatesWinsAndLosses() {
        Game game = buildInProgressGame();
        when(gameRepository.findByTokenAndIsActiveTrue("654321")).thenReturn(Optional.of(game));

        int initialWins = redPlayer.getWins();
        int initialLosses = bluePlayer.getLosses();

        gameService.surrender("654321", bluePlayer.getId());

        assertThat(redPlayer.getWins()).isEqualTo(initialWins + 1);
        assertThat(bluePlayer.getLosses()).isEqualTo(initialLosses + 1);
    }

    // --- Rejection tests ---

    @Test
    void surrender_gameFinished_rejects() {
        Game game = buildInProgressGame();
        game.setPhase(GamePhase.FINISHED);
        when(gameRepository.findByTokenAndIsActiveTrue("654321")).thenReturn(Optional.of(game));

        assertThatThrownBy(() -> gameService.surrender("654321", bluePlayer.getId()))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode().value()).isEqualTo(400);
                    assertThat(rse.getReason()).contains("Cannot surrender");
                });
    }

    @Test
    void surrender_notParticipant_rejects() {
        Game game = buildInProgressGame();
        when(gameRepository.findByTokenAndIsActiveTrue("654321")).thenReturn(Optional.of(game));

        User stranger = buildUser("Stranger");

        assertThatThrownBy(() -> gameService.surrender("654321", stranger.getId()))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode().value()).isEqualTo(403);
                    assertThat(rse.getReason()).contains("not a participant");
                });
    }

    @Test
    void surrender_gameNotFound_rejects() {
        when(gameRepository.findByTokenAndIsActiveTrue("999999")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> gameService.surrender("999999", bluePlayer.getId()))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode().value()).isEqualTo(404);
                });
    }
}
