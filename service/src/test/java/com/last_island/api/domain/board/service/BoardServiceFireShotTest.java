package com.last_island.api.domain.board.service;

import com.last_island.api.domain.board.dto.ShotRequest;
import com.last_island.api.domain.board.dto.ShotResponse;
import com.last_island.api.domain.board.entity.Board;
import com.last_island.api.domain.board.entity.Ship;
import com.last_island.api.domain.board.entity.Shot;
import com.last_island.api.domain.board.enums.Orientation;
import com.last_island.api.domain.board.enums.ShipType;
import com.last_island.api.domain.board.enums.ShotResult;
import com.last_island.api.domain.game.entity.Game;
import com.last_island.api.domain.game.entity.GameResult;
import com.last_island.api.domain.game.enums.GamePhase;
import com.last_island.api.domain.game.repository.GameRepository;
import com.last_island.api.domain.game.repository.GameResultRepository;
import com.last_island.api.domain.user.entity.User;
import com.last_island.api.domain.user.enums.Filiation;
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
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BoardServiceFireShotTest {

    @Mock
    private GameRepository gameRepository;

    @Mock
    private GameResultRepository gameResultRepository;

    @InjectMocks
    private BoardService boardService;

    private User bluePlayer;
    private User redPlayer;
    private static final String TOKEN = "123456";

    @BeforeEach
    void setUp() {
        bluePlayer = buildUser("Luffy", Filiation.PIRATE);
        redPlayer = buildUser("Akainu", Filiation.MARINE);
    }

    // --- Helper methods ---

    private User buildUser(String name, Filiation filiation) {
        User user = User.builder()
                .name(name)
                .email(name.toLowerCase() + "@test.com")
                .passwordHash("hashed")
                .filiation(filiation)
                .rank("Rookie")
                .build();
        user.setId(UUID.randomUUID());
        return user;
    }

    /**
     * Creates an IN_PROGRESS game where bluePlayer has the current turn.
     * Red board has one STRIKER ship at (0,0) HORIZONTAL (size=2, occupies (0,0) and (0,1)).
     */
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

        // Place a STRIKER (size=2) on red's board at (0,0) HORIZONTAL
        Ship striker = Ship.builder()
                .board(redBoard)
                .type(ShipType.STRIKER)
                .orientation(Orientation.HORIZONTAL)
                .row(0).col(0).hits(0)
                .build();
        striker.setId(UUID.randomUUID());
        redBoard.getShips().add(striker);

        Game game = Game.builder()
                .blueBoard(blueBoard)
                .redBoard(redBoard)
                .phase(GamePhase.IN_PROGRESS)
                .currentTurn(bluePlayer)
                .token(TOKEN)
                .build();
        game.setId(UUID.randomUUID());
        return game;
    }

    // --- Shooting Mechanics Tests ---

    @Test
    void fireShot_miss_success() {
        Game game = buildInProgressGame();
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        ShotResponse response = boardService.fireShot(TOKEN, bluePlayer.getId(), new ShotRequest(5, 5));

        assertThat(response.result()).isEqualTo(ShotResult.MISS);
        assertThat(response.gameOver()).isFalse();
        assertThat(response.sunkShipType()).isNull();
    }

    @Test
    void fireShot_hit_success() {
        Game game = buildInProgressGame();
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        // Striker is at (0,0)-(0,1), fire at (0,0) → HIT
        ShotResponse response = boardService.fireShot(TOKEN, bluePlayer.getId(), new ShotRequest(0, 0));

        assertThat(response.result()).isEqualTo(ShotResult.HIT);
        assertThat(response.gameOver()).isFalse();
        assertThat(response.sunkShipType()).isNull();
        // Ship should have 1 hit now
        Ship striker = game.getRedBoard().getShips().get(0);
        assertThat(striker.getHits()).isEqualTo(1);
    }

    @Test
    void fireShot_sunk_success() {
        Game game = buildInProgressGame();
        // Set striker (size=2) to already have 1 hit
        Ship striker = game.getRedBoard().getShips().get(0);
        striker.setHits(1);

        // Add another ship that is NOT sunk so game doesn't end
        Ship redForce = Ship.builder()
                .board(game.getRedBoard())
                .type(ShipType.CUTTER)
                .orientation(Orientation.HORIZONTAL)
                .row(5).col(5).hits(0)
                .build();
        redForce.setId(UUID.randomUUID());
        game.getRedBoard().getShips().add(redForce);

        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        // Fire at (0,1) — the second cell of the striker
        ShotResponse response = boardService.fireShot(TOKEN, bluePlayer.getId(), new ShotRequest(0, 1));

        assertThat(response.result()).isEqualTo(ShotResult.SUNK);
        assertThat(response.sunkShipType()).isEqualTo("STRIKER");
        assertThat(response.gameOver()).isFalse();
    }

    @Test
    void fireShot_outOfBounds_rejects() {
        // No need to mock — validation happens before fetching game
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> boardService.fireShot(TOKEN, bluePlayer.getId(), new ShotRequest(10, 5)));

        assertThat(ex.getStatusCode().value()).isEqualTo(400);
        assertThat(ex.getReason()).contains("off the sea chart");
    }

    @Test
    void fireShot_notInProgress_rejects() {
        Game game = buildInProgressGame();
        game.setPhase(GamePhase.PLACING_SHIPS);
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> boardService.fireShot(TOKEN, bluePlayer.getId(), new ShotRequest(5, 5)));

        assertThat(ex.getStatusCode().value()).isEqualTo(400);
        assertThat(ex.getReason()).contains("has not started");
    }

    @Test
    void fireShot_notParticipant_rejects() {
        Game game = buildInProgressGame();
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        User stranger = buildUser("Stranger", Filiation.PIRATE);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> boardService.fireShot(TOKEN, stranger.getId(), new ShotRequest(5, 5)));

        assertThat(ex.getStatusCode().value()).isEqualTo(403);
        assertThat(ex.getReason()).contains("not a participant");
    }

    @Test
    void fireShot_notYourTurn_rejects() {
        Game game = buildInProgressGame();
        // currentTurn is bluePlayer, but red tries to fire
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> boardService.fireShot(TOKEN, redPlayer.getId(), new ShotRequest(5, 5)));

        assertThat(ex.getStatusCode().value()).isEqualTo(409);
        assertThat(ex.getReason()).contains("not your turn");
    }

    @Test
    void fireShot_duplicateShot_rejects() {
        Game game = buildInProgressGame();
        // Add an existing shot at (5,5) on red's board
        Shot existingShot = Shot.builder()
                .board(game.getRedBoard())
                .attacker(bluePlayer)
                .row(5).col(5)
                .result(ShotResult.MISS)
                .build();
        game.getRedBoard().getShots().add(existingShot);
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> boardService.fireShot(TOKEN, bluePlayer.getId(), new ShotRequest(5, 5)));

        assertThat(ex.getStatusCode().value()).isEqualTo(409);
        assertThat(ex.getReason()).contains("already fired");
    }

    @Test
    void fireShot_switchesTurn_onMiss() {
        Game game = buildInProgressGame();
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        boardService.fireShot(TOKEN, bluePlayer.getId(), new ShotRequest(5, 5)); // MISS

        assertThat(game.getCurrentTurn()).isEqualTo(redPlayer);
    }

    @Test
    void fireShot_keepsTurn_onHit() {
        Game game = buildInProgressGame();
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        // Fire at (0,0) → HIT on striker
        boardService.fireShot(TOKEN, bluePlayer.getId(), new ShotRequest(0, 0));

        assertThat(game.getCurrentTurn()).isEqualTo(bluePlayer);
    }

    @Test
    void fireShot_keepsTurn_onSunk() {
        Game game = buildInProgressGame();
        // Set striker (size=2) to already have 1 hit
        game.getRedBoard().getShips().get(0).setHits(1);

        // Add another ship so game doesn't end
        Ship cutter = Ship.builder()
                .board(game.getRedBoard())
                .type(ShipType.CUTTER)
                .orientation(Orientation.HORIZONTAL)
                .row(5).col(5).hits(0)
                .build();
        cutter.setId(UUID.randomUUID());
        game.getRedBoard().getShips().add(cutter);

        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        // Fire at (0,1) — sinks the striker
        boardService.fireShot(TOKEN, bluePlayer.getId(), new ShotRequest(0, 1));

        assertThat(game.getCurrentTurn()).isEqualTo(bluePlayer);
    }

    @Test
    void fireShot_updatesStats_hit() {
        Game game = buildInProgressGame();
        bluePlayer.setTotalShots(0);
        bluePlayer.setTotalHits(0);
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        // Fire at (0,0) → HIT on striker
        boardService.fireShot(TOKEN, bluePlayer.getId(), new ShotRequest(0, 0));

        assertThat(bluePlayer.getTotalShots()).isEqualTo(1);
        assertThat(bluePlayer.getTotalHits()).isEqualTo(1);
    }

    @Test
    void fireShot_updatesStats_miss() {
        Game game = buildInProgressGame();
        bluePlayer.setTotalShots(0);
        bluePlayer.setTotalHits(0);
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        // Fire at empty cell → MISS
        boardService.fireShot(TOKEN, bluePlayer.getId(), new ShotRequest(5, 5));

        assertThat(bluePlayer.getTotalShots()).isEqualTo(1);
        assertThat(bluePlayer.getTotalHits()).isEqualTo(0);
    }

    // --- Win Condition Tests ---

    @Test
    void fireShot_sinkLastShip_setsFinished() {
        Game game = buildInProgressGame();
        // Striker (size=2) already has 1 hit, and it's the only ship
        game.getRedBoard().getShips().get(0).setHits(1);
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        boardService.fireShot(TOKEN, bluePlayer.getId(), new ShotRequest(0, 1));

        assertThat(game.getPhase()).isEqualTo(GamePhase.FINISHED);
    }

    @Test
    void fireShot_sinkLastShip_createsGameResult() {
        Game game = buildInProgressGame();
        game.getRedBoard().getShips().get(0).setHits(1);
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        boardService.fireShot(TOKEN, bluePlayer.getId(), new ShotRequest(0, 1));

        ArgumentCaptor<GameResult> captor = ArgumentCaptor.forClass(GameResult.class);
        verify(gameResultRepository).save(captor.capture());

        GameResult result = captor.getValue();
        assertThat(result.getWinner()).isEqualTo(bluePlayer);
        assertThat(result.getLoser()).isEqualTo(redPlayer);
        assertThat(result.getGame()).isEqualTo(game);
    }

    @Test
    void fireShot_sinkLastShip_updatesWinsLosses() {
        Game game = buildInProgressGame();
        game.getRedBoard().getShips().get(0).setHits(1);
        bluePlayer.setWins(0);
        redPlayer.setLosses(0);
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        boardService.fireShot(TOKEN, bluePlayer.getId(), new ShotRequest(0, 1));

        assertThat(bluePlayer.getWins()).isEqualTo(1);
        assertThat(redPlayer.getLosses()).isEqualTo(1);
    }

    @Test
    void fireShot_sinkLastShip_returnsGameOver() {
        Game game = buildInProgressGame();
        game.getRedBoard().getShips().get(0).setHits(1);
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        ShotResponse response = boardService.fireShot(TOKEN, bluePlayer.getId(), new ShotRequest(0, 1));

        assertThat(response.gameOver()).isTrue();
        assertThat(response.winnerName()).isEqualTo("Luffy");
    }

    @Test
    void fireShot_sinkLastShip_doesNotSwitchTurn() {
        Game game = buildInProgressGame();
        game.getRedBoard().getShips().get(0).setHits(1);
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        boardService.fireShot(TOKEN, bluePlayer.getId(), new ShotRequest(0, 1));

        // Turn should remain with bluePlayer (not switched to redPlayer)
        assertThat(game.getCurrentTurn()).isEqualTo(bluePlayer);
    }
}
