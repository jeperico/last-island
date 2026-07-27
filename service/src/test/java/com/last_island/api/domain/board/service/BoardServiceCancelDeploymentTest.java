package com.last_island.api.domain.board.service;

import com.last_island.api.domain.board.entity.Board;
import com.last_island.api.domain.board.entity.Ship;
import com.last_island.api.domain.board.enums.Orientation;
import com.last_island.api.domain.board.enums.ShipType;
import com.last_island.api.domain.game.entity.Game;
import com.last_island.api.domain.game.enums.GamePhase;
import com.last_island.api.domain.game.repository.GameRepository;
import com.last_island.api.domain.game.repository.GameResultRepository;
import com.last_island.api.domain.user.entity.User;
import com.last_island.api.domain.user.service.BountyService;
import com.last_island.api.domain.haki.repository.HakiBattleStateRepository;
import com.last_island.api.domain.haki.service.HakiBattleService;
import com.last_island.api.infrastructure.metrics.GameMetrics;
import com.last_island.api.infrastructure.sse.GameEventEmitter;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BoardServiceCancelDeploymentTest {

    @Mock
    private GameRepository gameRepository;

    @Mock
    private GameResultRepository gameResultRepository;

    @Mock
    private GameEventEmitter gameEventEmitter;

    @Mock
    private BountyService bountyService;

    @Mock
    private HakiBattleService hakiBattleService;

    @Mock
    private HakiBattleStateRepository hakiBattleStateRepository;

    @Mock
    private GameMetrics gameMetrics;

    @InjectMocks
    private BoardService boardService;

    private User bluePlayer;
    private User redPlayer;
    private static final String TOKEN = "123456";

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

    private Game buildGame(GamePhase phase) {
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
                .phase(phase)
                .token(TOKEN)
                .build();
        game.setId(UUID.randomUUID());
        return game;
    }

    private void addShipsToBoard(Board board) {
        board.getShips().add(Ship.builder()
                .board(board)
                .type(ShipType.THOUSAND_SUNNY)
                .orientation(Orientation.HORIZONTAL)
                .row(0).col(0).hits(0)
                .build());
        board.getShips().add(Ship.builder()
                .board(board)
                .type(ShipType.MOBY_DICK)
                .orientation(Orientation.HORIZONTAL)
                .row(1).col(0).hits(0)
                .build());
    }

    // --- Tests ---

    @Test
    void cancelDeployment_happyPath_clearsShipsAndDeletesHakiState() {
        Game game = buildGame(GamePhase.PLACING_SHIPS);
        addShipsToBoard(game.getBlueBoard());
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        boardService.cancelDeployment(TOKEN, bluePlayer.getId());

        assertThat(game.getBlueBoard().getShips()).isEmpty();
        verify(hakiBattleStateRepository).deleteByBoardId(game.getBlueBoard().getId());
        verify(gameRepository).save(game);
    }

    @Test
    void cancelDeployment_opponentAlreadyPlaced_rejects409() {
        Game game = buildGame(GamePhase.PLACING_SHIPS);
        addShipsToBoard(game.getBlueBoard());
        addShipsToBoard(game.getRedBoard());
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> boardService.cancelDeployment(TOKEN, bluePlayer.getId()));

        assertThat(ex.getStatusCode().value()).isEqualTo(409);
        assertThat(ex.getReason()).contains("Opponent has already deployed their fleet");
    }

    @Test
    void cancelDeployment_playerHasNoShips_rejects409() {
        Game game = buildGame(GamePhase.PLACING_SHIPS);
        // Blue board has no ships
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> boardService.cancelDeployment(TOKEN, bluePlayer.getId()));

        assertThat(ex.getStatusCode().value()).isEqualTo(409);
        assertThat(ex.getReason()).contains("No fleet deployed to cancel");
    }

    @Test
    void cancelDeployment_gameNotInPlacingShips_rejects409() {
        Game game = buildGame(GamePhase.IN_PROGRESS);
        addShipsToBoard(game.getBlueBoard());
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> boardService.cancelDeployment(TOKEN, bluePlayer.getId()));

        assertThat(ex.getStatusCode().value()).isEqualTo(409);
        assertThat(ex.getReason()).contains("Battle is no longer in placement phase");
    }

    @Test
    void cancelDeployment_userNotParticipant_rejects403() {
        Game game = buildGame(GamePhase.PLACING_SHIPS);
        addShipsToBoard(game.getBlueBoard());
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        User stranger = buildUser("Stranger");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> boardService.cancelDeployment(TOKEN, stranger.getId()));

        assertThat(ex.getStatusCode().value()).isEqualTo(403);
        assertThat(ex.getReason()).contains("not a participant");
    }

    @Test
    void cancelDeployment_gameNotFound_rejects404() {
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.empty());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> boardService.cancelDeployment(TOKEN, bluePlayer.getId()));

        assertThat(ex.getStatusCode().value()).isEqualTo(404);
        assertThat(ex.getReason()).contains("Battle not found");
    }
}
