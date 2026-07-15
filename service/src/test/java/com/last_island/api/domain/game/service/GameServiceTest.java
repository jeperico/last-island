package com.last_island.api.domain.game.service;

import com.last_island.api.domain.board.entity.Board;
import com.last_island.api.domain.board.entity.Ship;
import com.last_island.api.domain.board.entity.Shot;
import com.last_island.api.domain.board.enums.Orientation;
import com.last_island.api.domain.board.enums.ShipType;
import com.last_island.api.domain.board.enums.ShotResult;
import com.last_island.api.domain.game.dto.CreateGameResponse;
import com.last_island.api.domain.game.dto.GameResponse;
import com.last_island.api.domain.game.dto.GameStateResponse;
import com.last_island.api.domain.game.entity.Game;
import com.last_island.api.domain.game.enums.GamePhase;
import com.last_island.api.domain.game.repository.GameRepository;
import com.last_island.api.domain.user.entity.User;
import com.last_island.api.domain.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GameServiceTest {

    @Mock
    private GameRepository gameRepository;

    @Mock
    private UserRepository userRepository;

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
                .build();
        user.setId(UUID.randomUUID());
        return user;
    }

    private Game buildWaitingGame() {
        Board blueBoard = Board.builder()
                .owner(bluePlayer)
                .ships(new ArrayList<>())
                .shots(new ArrayList<>())
                .build();
        blueBoard.setId(UUID.randomUUID());

        Game game = Game.builder()
                .blueBoard(blueBoard)
                .phase(GamePhase.WAITING_OPPONENT)
                .token("123456")
                .build();
        game.setId(UUID.randomUUID());
        return game;
    }

    private Game buildInProgressGameWithBoards() {
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

        // Add a ship to blue's board
        Ship blueShip = Ship.builder()
                .board(blueBoard)
                .type(ShipType.THOUSAND_SUNNY)
                .orientation(Orientation.HORIZONTAL)
                .row(0).col(0).hits(0)
                .build();
        blueBoard.getShips().add(blueShip);

        // Add a shot on red's board (fired by blue)
        Shot shotOnRed = Shot.builder()
                .board(redBoard)
                .attacker(bluePlayer)
                .row(3).col(3)
                .result(ShotResult.MISS)
                .build();
        redBoard.getShots().add(shotOnRed);

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

    // --- Game Creation Tests ---

    @Test
    void createGame_success() {
        when(userRepository.findById(bluePlayer.getId())).thenReturn(Optional.of(bluePlayer));
        when(gameRepository.existsByToken(any())).thenReturn(false);

        CreateGameResponse response = gameService.createGame(bluePlayer.getId());

        assertThat(response).isNotNull();
        assertThat(response.token()).isNotNull();
        assertThat(response.phase()).isEqualTo("WAITING_OPPONENT");
        verify(gameRepository).save(any(Game.class));
    }

    // --- Join Game Tests ---

    @Test
    void joinGame_success() {
        Game game = buildWaitingGame();
        when(gameRepository.findByTokenAndIsActiveTrue("123456")).thenReturn(Optional.of(game));
        when(userRepository.findById(redPlayer.getId())).thenReturn(Optional.of(redPlayer));

        GameResponse response = gameService.joinGame("123456", redPlayer.getId());

        assertThat(response.phase()).isEqualTo("PLACING_SHIPS");
        assertThat(response.redPlayerName()).isEqualTo("Zoro");
        // currentTurn must be one of the two players
        assertThat(response.currentTurnPlayerName()).isIn("Luffy", "Zoro");
        verify(gameRepository).save(game);
    }

    @Test
    void joinGame_notWaiting_rejects() {
        Game game = buildWaitingGame();
        game.setPhase(GamePhase.IN_PROGRESS);
        when(gameRepository.findByTokenAndIsActiveTrue("123456")).thenReturn(Optional.of(game));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> gameService.joinGame("123456", redPlayer.getId()));

        assertThat(ex.getStatusCode().value()).isEqualTo(409);
        assertThat(ex.getReason()).contains("not accepting new pirates");
    }

    @Test
    void joinGame_ownGame_rejects() {
        Game game = buildWaitingGame();
        when(gameRepository.findByTokenAndIsActiveTrue("123456")).thenReturn(Optional.of(game));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> gameService.joinGame("123456", bluePlayer.getId()));

        assertThat(ex.getStatusCode().value()).isEqualTo(409);
        assertThat(ex.getReason()).contains("Cannot join your own battle");
    }

    // --- Fog of War Tests (getGame) ---

    @Test
    void getGame_returnsMyBoardWithShips() {
        Game game = buildInProgressGameWithBoards();
        when(gameRepository.findByTokenAndIsActiveTrue("654321")).thenReturn(Optional.of(game));

        GameStateResponse response = gameService.getGame("654321", bluePlayer.getId());

        assertThat(response.myBoard()).isNotNull();
        assertThat(response.myBoard().ships()).isNotEmpty();
        assertThat(response.myBoard().ships().get(0).type()).isEqualTo("THOUSAND_SUNNY");
    }

    @Test
    void getGame_returnsOpponentBoardWithoutShips() {
        Game game = buildInProgressGameWithBoards();
        when(gameRepository.findByTokenAndIsActiveTrue("654321")).thenReturn(Optional.of(game));

        GameStateResponse response = gameService.getGame("654321", bluePlayer.getId());

        assertThat(response.opponentBoard()).isNotNull();
        // OpponentBoardResponse doesn't have ships — only shotsFired
        assertThat(response.opponentBoard().shotsFired()).hasSize(1);
        assertThat(response.opponentBoard().shotsFired().get(0).row()).isEqualTo(3);
        assertThat(response.opponentBoard().shotsFired().get(0).col()).isEqualTo(3);
    }

    @Test
    void getGame_notParticipant_rejects() {
        Game game = buildInProgressGameWithBoards();
        when(gameRepository.findByTokenAndIsActiveTrue("654321")).thenReturn(Optional.of(game));

        User stranger = buildUser("Stranger");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> gameService.getGame("654321", stranger.getId()));

        assertThat(ex.getStatusCode().value()).isEqualTo(403);
        assertThat(ex.getReason()).contains("not a participant");
    }
}
