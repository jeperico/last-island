package com.last_island.api.domain.board.service;

import com.last_island.api.domain.board.dto.BoardResponse;
import com.last_island.api.domain.board.dto.PlaceShipsRequest;
import com.last_island.api.domain.board.dto.ShipPlacementDto;
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
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BoardServicePlaceShipsTest {

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

    private List<ShipPlacementDto> piratePlacement() {
        return List.of(
                new ShipPlacementDto(ShipType.THOUSAND_SUNNY, Orientation.HORIZONTAL, 0, 0),
                new ShipPlacementDto(ShipType.MOBY_DICK, Orientation.HORIZONTAL, 1, 0),
                new ShipPlacementDto(ShipType.RED_FORCE, Orientation.HORIZONTAL, 2, 0),
                new ShipPlacementDto(ShipType.POLAR_TANG, Orientation.HORIZONTAL, 3, 0),
                new ShipPlacementDto(ShipType.STRIKER, Orientation.HORIZONTAL, 4, 0)
        );
    }

    // --- Tests ---

    @Test
    void placeShips_validFleet_success() {
        Game game = buildGame(GamePhase.PLACING_SHIPS);
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        PlaceShipsRequest request = new PlaceShipsRequest(piratePlacement());
        BoardResponse response = boardService.placeShips(TOKEN, bluePlayer.getId(), request);

        assertThat(response.ships()).hasSize(5);
        assertThat(response.gamePhase()).isEqualTo("PLACING_SHIPS");
        verify(gameRepository).save(game);
    }

    @Test
    void placeShips_wrongPhase_rejects() {
        Game game = buildGame(GamePhase.WAITING_OPPONENT);
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        PlaceShipsRequest request = new PlaceShipsRequest(piratePlacement());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> boardService.placeShips(TOKEN, bluePlayer.getId(), request));

        assertThat(ex.getStatusCode().value()).isEqualTo(400);
        assertThat(ex.getReason()).contains("not in the fleet deployment phase");
    }

    @Test
    void placeShips_notParticipant_rejects() {
        Game game = buildGame(GamePhase.PLACING_SHIPS);
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        User stranger = buildUser("Stranger");
        PlaceShipsRequest request = new PlaceShipsRequest(piratePlacement());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> boardService.placeShips(TOKEN, stranger.getId(), request));

        assertThat(ex.getStatusCode().value()).isEqualTo(403);
        assertThat(ex.getReason()).contains("not a participant");
    }

    @Test
    void placeShips_fleetAlreadyDeployed_clearsAndRedeploys() {
        Game game = buildGame(GamePhase.PLACING_SHIPS);
        // Add a ship to blue board to simulate already deployed
        Ship existingShip = Ship.builder()
                .board(game.getBlueBoard())
                .type(ShipType.STRIKER)
                .orientation(Orientation.VERTICAL)
                .row(9).col(9).hits(0)
                .build();
        game.getBlueBoard().getShips().add(existingShip);
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        PlaceShipsRequest request = new PlaceShipsRequest(piratePlacement());
        BoardResponse response = boardService.placeShips(TOKEN, bluePlayer.getId(), request);

        // Old ship cleared, new fleet placed
        assertThat(game.getBlueBoard().getShips()).hasSize(5);
        assertThat(response.ships()).hasSize(5);
        // Verify all 5 pirate fleet types are present
        assertThat(game.getBlueBoard().getShips().stream()
                .map(Ship::getType)
                .toList())
                .containsExactlyInAnyOrder(
                        ShipType.THOUSAND_SUNNY, ShipType.MOBY_DICK, ShipType.RED_FORCE,
                        ShipType.POLAR_TANG, ShipType.STRIKER);
        verify(gameRepository).save(game);
    }

    @Test
    void placeShips_notFiveShips_rejects() {
        Game game = buildGame(GamePhase.PLACING_SHIPS);
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        List<ShipPlacementDto> threeShips = List.of(
                new ShipPlacementDto(ShipType.THOUSAND_SUNNY, Orientation.HORIZONTAL, 0, 0),
                new ShipPlacementDto(ShipType.MOBY_DICK, Orientation.HORIZONTAL, 1, 0),
                new ShipPlacementDto(ShipType.RED_FORCE, Orientation.HORIZONTAL, 2, 0)
        );
        PlaceShipsRequest request = new PlaceShipsRequest(threeShips);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> boardService.placeShips(TOKEN, bluePlayer.getId(), request));

        assertThat(ex.getStatusCode().value()).isEqualTo(400);
        assertThat(ex.getReason()).contains("exactly 5 vessels");
    }

    @Test
    void placeShips_wrongFleet_rejects() {
        Game game = buildGame(GamePhase.PLACING_SHIPS);
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        // Submit deprecated marine fleet — should be rejected
        List<ShipPlacementDto> wrongFleet = List.of(
                new ShipPlacementDto(ShipType.BUSTER_CALL, Orientation.HORIZONTAL, 0, 0),
                new ShipPlacementDto(ShipType.WARSHIP, Orientation.HORIZONTAL, 1, 0),
                new ShipPlacementDto(ShipType.BATTLESHIP, Orientation.HORIZONTAL, 2, 0),
                new ShipPlacementDto(ShipType.CRUISER, Orientation.HORIZONTAL, 3, 0),
                new ShipPlacementDto(ShipType.CUTTER, Orientation.HORIZONTAL, 4, 0)
        );
        PlaceShipsRequest request = new PlaceShipsRequest(wrongFleet);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> boardService.placeShips(TOKEN, bluePlayer.getId(), request));

        assertThat(ex.getStatusCode().value()).isEqualTo(400);
        assertThat(ex.getReason()).contains("pirate fleet");
    }

    @Test
    void placeShips_outOfBounds_rejects() {
        Game game = buildGame(GamePhase.PLACING_SHIPS);
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        List<ShipPlacementDto> ships = List.of(
                new ShipPlacementDto(ShipType.THOUSAND_SUNNY, Orientation.HORIZONTAL, -1, 0),
                new ShipPlacementDto(ShipType.MOBY_DICK, Orientation.HORIZONTAL, 1, 0),
                new ShipPlacementDto(ShipType.RED_FORCE, Orientation.HORIZONTAL, 2, 0),
                new ShipPlacementDto(ShipType.POLAR_TANG, Orientation.HORIZONTAL, 3, 0),
                new ShipPlacementDto(ShipType.STRIKER, Orientation.HORIZONTAL, 4, 0)
        );
        PlaceShipsRequest request = new PlaceShipsRequest(ships);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> boardService.placeShips(TOKEN, bluePlayer.getId(), request));

        assertThat(ex.getStatusCode().value()).isEqualTo(400);
        assertThat(ex.getReason()).contains("off the sea chart");
    }

    @Test
    void placeShips_extendsHorizontally_rejects() {
        Game game = buildGame(GamePhase.PLACING_SHIPS);
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        // THOUSAND_SUNNY size=5 at col=7 HORIZONTAL → occupies cols 7,8,9,10,11 → overflow
        List<ShipPlacementDto> ships = List.of(
                new ShipPlacementDto(ShipType.THOUSAND_SUNNY, Orientation.HORIZONTAL, 0, 7),
                new ShipPlacementDto(ShipType.MOBY_DICK, Orientation.HORIZONTAL, 1, 0),
                new ShipPlacementDto(ShipType.RED_FORCE, Orientation.HORIZONTAL, 2, 0),
                new ShipPlacementDto(ShipType.POLAR_TANG, Orientation.HORIZONTAL, 3, 0),
                new ShipPlacementDto(ShipType.STRIKER, Orientation.HORIZONTAL, 4, 0)
        );
        PlaceShipsRequest request = new PlaceShipsRequest(ships);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> boardService.placeShips(TOKEN, bluePlayer.getId(), request));

        assertThat(ex.getStatusCode().value()).isEqualTo(400);
        assertThat(ex.getReason()).contains("beyond the sea chart horizontally");
    }

    @Test
    void placeShips_extendsVertically_rejects() {
        Game game = buildGame(GamePhase.PLACING_SHIPS);
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        // THOUSAND_SUNNY size=5 at row=7 VERTICAL → occupies rows 7,8,9,10,11 → overflow
        List<ShipPlacementDto> ships = List.of(
                new ShipPlacementDto(ShipType.THOUSAND_SUNNY, Orientation.VERTICAL, 7, 0),
                new ShipPlacementDto(ShipType.MOBY_DICK, Orientation.HORIZONTAL, 1, 0),
                new ShipPlacementDto(ShipType.RED_FORCE, Orientation.HORIZONTAL, 2, 0),
                new ShipPlacementDto(ShipType.POLAR_TANG, Orientation.HORIZONTAL, 3, 0),
                new ShipPlacementDto(ShipType.STRIKER, Orientation.HORIZONTAL, 4, 0)
        );
        PlaceShipsRequest request = new PlaceShipsRequest(ships);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> boardService.placeShips(TOKEN, bluePlayer.getId(), request));

        assertThat(ex.getStatusCode().value()).isEqualTo(400);
        assertThat(ex.getReason()).contains("beyond the sea chart vertically");
    }

    @Test
    void placeShips_overlap_rejects() {
        Game game = buildGame(GamePhase.PLACING_SHIPS);
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        // Two ships at same position
        List<ShipPlacementDto> ships = List.of(
                new ShipPlacementDto(ShipType.THOUSAND_SUNNY, Orientation.HORIZONTAL, 0, 0),
                new ShipPlacementDto(ShipType.MOBY_DICK, Orientation.HORIZONTAL, 0, 0), // overlaps
                new ShipPlacementDto(ShipType.RED_FORCE, Orientation.HORIZONTAL, 2, 0),
                new ShipPlacementDto(ShipType.POLAR_TANG, Orientation.HORIZONTAL, 3, 0),
                new ShipPlacementDto(ShipType.STRIKER, Orientation.HORIZONTAL, 4, 0)
        );
        PlaceShipsRequest request = new PlaceShipsRequest(ships);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> boardService.placeShips(TOKEN, bluePlayer.getId(), request));

        assertThat(ex.getStatusCode().value()).isEqualTo(400);
        assertThat(ex.getReason()).contains("cannot overlap");
    }

    @Test
    void placeShips_bothPlaced_transitionsToInProgress() {
        Game game = buildGame(GamePhase.PLACING_SHIPS);
        // Opponent (red) has already placed ships
        Ship opponentShip = Ship.builder()
                .board(game.getRedBoard())
                .type(ShipType.THOUSAND_SUNNY)
                .orientation(Orientation.HORIZONTAL)
                .row(0).col(0).hits(0)
                .build();
        game.getRedBoard().getShips().add(opponentShip);
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        PlaceShipsRequest request = new PlaceShipsRequest(piratePlacement());
        BoardResponse response = boardService.placeShips(TOKEN, bluePlayer.getId(), request);

        assertThat(game.getPhase()).isEqualTo(GamePhase.IN_PROGRESS);
        assertThat(response.gamePhase()).isEqualTo("IN_PROGRESS");
        verify(gameRepository).save(game);
    }
}
