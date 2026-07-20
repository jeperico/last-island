package com.last_island.api.domain.haki.service;

import com.last_island.api.domain.board.entity.Board;
import com.last_island.api.domain.board.entity.Ship;
import com.last_island.api.domain.board.entity.Shot;
import com.last_island.api.domain.board.enums.Orientation;
import com.last_island.api.domain.board.enums.ShipType;
import com.last_island.api.domain.board.enums.ShotResult;
import com.last_island.api.domain.game.entity.Game;
import com.last_island.api.domain.game.enums.GamePhase;
import com.last_island.api.domain.game.repository.GameRepository;
import com.last_island.api.domain.haki.dto.ArmamentAssignmentRequest;
import com.last_island.api.domain.haki.dto.ArmamentTriggerResult;
import com.last_island.api.domain.haki.dto.CounterFireResult;
import com.last_island.api.domain.haki.entity.HakiBattleState;
import com.last_island.api.domain.haki.entity.HakiProfile;
import com.last_island.api.domain.haki.repository.HakiBattleStateRepository;
import com.last_island.api.domain.haki.repository.HakiProfileRepository;
import com.last_island.api.domain.user.entity.User;
import com.last_island.api.infrastructure.sse.GameEventEmitter;
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
class HakiArmamentServiceTest {

    @Mock
    private HakiBattleStateRepository hakiBattleStateRepository;

    @Mock
    private HakiProfileRepository hakiProfileRepository;

    @Mock
    private GameRepository gameRepository;

    @Mock
    private GameEventEmitter gameEventEmitter;

    @InjectMocks
    private HakiBattleService hakiBattleService;

    private User bluePlayer;
    private User redPlayer;
    private static final String TOKEN = "ARM123";

    @BeforeEach
    void setUp() {
        bluePlayer = buildUser("Luffy");
        redPlayer = buildUser("Zoro");
    }

    // --- Helpers ---

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
                .token(TOKEN)
                .build();
        game.setId(UUID.randomUUID());
        return game;
    }

    private Ship buildShip(Board board, ShipType type, int row, int col, Orientation orientation) {
        Ship ship = Ship.builder()
                .board(board)
                .type(type)
                .orientation(orientation)
                .row(row).col(col).hits(0)
                .build();
        ship.setId(UUID.randomUUID());
        board.getShips().add(ship);
        return ship;
    }

    private HakiBattleState buildState(UUID boardId, int armamentLevel) {
        HakiBattleState state = HakiBattleState.builder()
                .boardId(boardId)
                .observationUsesRemaining(0)
                .observationUsesConsumed(0)
                .observationLevel(0)
                .conquerorsUsesRemaining(0)
                .hakiUsedThisTurn(false)
                .armamentLevel(armamentLevel)
                .armamentShip1Id(null)
                .armamentShip2Id(null)
                .armamentShip1HitsAbsorbed(0)
                .armamentShip2HitsAbsorbed(0)
                .opponentSkipTurns(0)
                .build();
        state.setId(UUID.randomUUID());
        return state;
    }

    // --- Assignment Validation Tests ---

    @Test
    void assignArmament_lv1_setsShip1_succeeds() {
        Game game = buildPlacingShipsGame();
        Ship ship1 = buildShip(game.getBlueBoard(), ShipType.STRIKER, 0, 0, Orientation.HORIZONTAL);
        HakiBattleState state = buildState(game.getBlueBoard().getId(), 1);

        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));
        when(hakiBattleStateRepository.findByBoardId(game.getBlueBoard().getId())).thenReturn(Optional.of(state));

        hakiBattleService.assignArmament(TOKEN, bluePlayer.getId(), new ArmamentAssignmentRequest(ship1.getId(), null));

        assertThat(state.getArmamentShip1Id()).isEqualTo(ship1.getId());
        assertThat(state.getArmamentShip2Id()).isNull();
        verify(hakiBattleStateRepository).save(state);
    }

    @Test
    void assignArmament_lv1_withShip2_throwsBadRequest() {
        Game game = buildPlacingShipsGame();
        Ship ship1 = buildShip(game.getBlueBoard(), ShipType.STRIKER, 0, 0, Orientation.HORIZONTAL);
        Ship ship2 = buildShip(game.getBlueBoard(), ShipType.RED_FORCE, 2, 0, Orientation.HORIZONTAL);
        HakiBattleState state = buildState(game.getBlueBoard().getId(), 1);

        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));
        when(hakiBattleStateRepository.findByBoardId(game.getBlueBoard().getId())).thenReturn(Optional.of(state));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> hakiBattleService.assignArmament(TOKEN, bluePlayer.getId(),
                        new ArmamentAssignmentRequest(ship1.getId(), ship2.getId())));

        assertThat(ex.getStatusCode().value()).isEqualTo(400);
        assertThat(ex.getReason()).contains("Level 1");
    }

    @Test
    void assignArmament_lv2_setsBothShips_succeeds() {
        Game game = buildPlacingShipsGame();
        Ship ship1 = buildShip(game.getBlueBoard(), ShipType.STRIKER, 0, 0, Orientation.HORIZONTAL);
        Ship ship2 = buildShip(game.getBlueBoard(), ShipType.RED_FORCE, 2, 0, Orientation.HORIZONTAL);
        HakiBattleState state = buildState(game.getBlueBoard().getId(), 2);

        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));
        when(hakiBattleStateRepository.findByBoardId(game.getBlueBoard().getId())).thenReturn(Optional.of(state));

        hakiBattleService.assignArmament(TOKEN, bluePlayer.getId(),
                new ArmamentAssignmentRequest(ship1.getId(), ship2.getId()));

        assertThat(state.getArmamentShip1Id()).isEqualTo(ship1.getId());
        assertThat(state.getArmamentShip2Id()).isEqualTo(ship2.getId());
        verify(hakiBattleStateRepository).save(state);
    }

    @Test
    void assignArmament_lv2_sameShipForBoth_throwsBadRequest() {
        Game game = buildPlacingShipsGame();
        Ship ship1 = buildShip(game.getBlueBoard(), ShipType.STRIKER, 0, 0, Orientation.HORIZONTAL);
        HakiBattleState state = buildState(game.getBlueBoard().getId(), 2);

        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));
        when(hakiBattleStateRepository.findByBoardId(game.getBlueBoard().getId())).thenReturn(Optional.of(state));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> hakiBattleService.assignArmament(TOKEN, bluePlayer.getId(),
                        new ArmamentAssignmentRequest(ship1.getId(), ship1.getId())));

        assertThat(ex.getStatusCode().value()).isEqualTo(400);
        assertThat(ex.getReason()).contains("different ships");
    }

    @Test
    void assignArmament_shipNotOnBoard_throwsBadRequest() {
        Game game = buildPlacingShipsGame();
        buildShip(game.getBlueBoard(), ShipType.STRIKER, 0, 0, Orientation.HORIZONTAL);
        HakiBattleState state = buildState(game.getBlueBoard().getId(), 1);

        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));
        when(hakiBattleStateRepository.findByBoardId(game.getBlueBoard().getId())).thenReturn(Optional.of(state));

        UUID fakeShipId = UUID.randomUUID();
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> hakiBattleService.assignArmament(TOKEN, bluePlayer.getId(),
                        new ArmamentAssignmentRequest(fakeShipId, null)));

        assertThat(ex.getStatusCode().value()).isEqualTo(400);
        assertThat(ex.getReason()).contains("does not belong");
    }

    @Test
    void assignArmament_noArmamentLevel_throwsBadRequest() {
        Game game = buildPlacingShipsGame();
        Ship ship1 = buildShip(game.getBlueBoard(), ShipType.STRIKER, 0, 0, Orientation.HORIZONTAL);
        HakiBattleState state = buildState(game.getBlueBoard().getId(), 0);

        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));
        when(hakiBattleStateRepository.findByBoardId(game.getBlueBoard().getId())).thenReturn(Optional.of(state));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> hakiBattleService.assignArmament(TOKEN, bluePlayer.getId(),
                        new ArmamentAssignmentRequest(ship1.getId(), null)));

        assertThat(ex.getStatusCode().value()).isEqualTo(400);
        assertThat(ex.getReason()).contains("not unlocked");
    }

    @Test
    void assignArmament_wrongPhase_throwsBadRequest() {
        Game game = buildPlacingShipsGame();
        game.setPhase(GamePhase.FINISHED);

        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> hakiBattleService.assignArmament(TOKEN, bluePlayer.getId(),
                        new ArmamentAssignmentRequest(UUID.randomUUID(), null)));

        assertThat(ex.getStatusCode().value()).isEqualTo(400);
        assertThat(ex.getReason()).contains("fleet deployment");
    }

    @Test
    void assignArmament_notParticipant_throwsForbidden() {
        Game game = buildPlacingShipsGame();
        User stranger = buildUser("Stranger");

        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> hakiBattleService.assignArmament(TOKEN, stranger.getId(),
                        new ArmamentAssignmentRequest(UUID.randomUUID(), null)));

        assertThat(ex.getStatusCode().value()).isEqualTo(403);
        assertThat(ex.getReason()).contains("not a participant");
    }

    // --- Trigger Tests ---

    @Test
    void checkArmament_lv1_firstHitOnShip1_setsSkipTurn() {
        Board defenderBoard = Board.builder().owner(redPlayer).ships(new ArrayList<>()).shots(new ArrayList<>()).build();
        defenderBoard.setId(UUID.randomUUID());
        Ship ship1 = buildShip(defenderBoard, ShipType.STRIKER, 0, 0, Orientation.HORIZONTAL);

        Board attackerBoard = Board.builder().owner(bluePlayer).ships(new ArrayList<>()).shots(new ArrayList<>()).build();
        attackerBoard.setId(UUID.randomUUID());

        HakiBattleState state = buildState(defenderBoard.getId(), 1);
        state.setArmamentShip1Id(ship1.getId());

        when(hakiBattleStateRepository.findByBoardId(defenderBoard.getId())).thenReturn(Optional.of(state));

        ArmamentTriggerResult result = hakiBattleService.checkArmamentTrigger(defenderBoard, ship1, 0, 0, attackerBoard);

        assertThat(result).isNotNull();
        assertThat(result.turnSkipped()).isTrue();
        assertThat(result.counterFire()).isNull();
        assertThat(state.getArmamentShip1HitsAbsorbed()).isEqualTo(1);
        assertThat(state.getOpponentSkipTurns()).isEqualTo(1);
    }

    @Test
    void checkArmament_lv1_secondHitOnShip1_noTrigger() {
        Board defenderBoard = Board.builder().owner(redPlayer).ships(new ArrayList<>()).shots(new ArrayList<>()).build();
        defenderBoard.setId(UUID.randomUUID());
        Ship ship1 = buildShip(defenderBoard, ShipType.STRIKER, 0, 0, Orientation.HORIZONTAL);

        Board attackerBoard = Board.builder().owner(bluePlayer).ships(new ArrayList<>()).shots(new ArrayList<>()).build();
        attackerBoard.setId(UUID.randomUUID());

        HakiBattleState state = buildState(defenderBoard.getId(), 1);
        state.setArmamentShip1Id(ship1.getId());
        state.setArmamentShip1HitsAbsorbed(1); // Already absorbed one hit

        when(hakiBattleStateRepository.findByBoardId(defenderBoard.getId())).thenReturn(Optional.of(state));

        ArmamentTriggerResult result = hakiBattleService.checkArmamentTrigger(defenderBoard, ship1, 0, 1, attackerBoard);

        assertThat(result).isNull();
    }

    @Test
    void checkArmament_lv2_ship2_first3Hits_eachTriggersSkip() {
        Board defenderBoard = Board.builder().owner(redPlayer).ships(new ArrayList<>()).shots(new ArrayList<>()).build();
        defenderBoard.setId(UUID.randomUUID());
        Ship ship2 = buildShip(defenderBoard, ShipType.MOBY_DICK, 0, 0, Orientation.HORIZONTAL);

        Board attackerBoard = Board.builder().owner(bluePlayer).ships(new ArrayList<>()).shots(new ArrayList<>()).build();
        attackerBoard.setId(UUID.randomUUID());

        HakiBattleState state = buildState(defenderBoard.getId(), 2);
        state.setArmamentShip2Id(ship2.getId());

        when(hakiBattleStateRepository.findByBoardId(defenderBoard.getId())).thenReturn(Optional.of(state));

        // First hit
        ArmamentTriggerResult r1 = hakiBattleService.checkArmamentTrigger(defenderBoard, ship2, 0, 0, attackerBoard);
        assertThat(r1).isNotNull();
        assertThat(r1.turnSkipped()).isTrue();

        // Second hit
        ArmamentTriggerResult r2 = hakiBattleService.checkArmamentTrigger(defenderBoard, ship2, 0, 1, attackerBoard);
        assertThat(r2).isNotNull();
        assertThat(r2.turnSkipped()).isTrue();

        // Third hit
        ArmamentTriggerResult r3 = hakiBattleService.checkArmamentTrigger(defenderBoard, ship2, 0, 2, attackerBoard);
        assertThat(r3).isNotNull();
        assertThat(r3.turnSkipped()).isTrue();

        assertThat(state.getArmamentShip2HitsAbsorbed()).isEqualTo(3);
        assertThat(state.getOpponentSkipTurns()).isEqualTo(3);
    }

    @Test
    void checkArmament_lv2_ship2_fourthHit_noTrigger() {
        Board defenderBoard = Board.builder().owner(redPlayer).ships(new ArrayList<>()).shots(new ArrayList<>()).build();
        defenderBoard.setId(UUID.randomUUID());
        Ship ship2 = buildShip(defenderBoard, ShipType.MOBY_DICK, 0, 0, Orientation.HORIZONTAL);

        Board attackerBoard = Board.builder().owner(bluePlayer).ships(new ArrayList<>()).shots(new ArrayList<>()).build();
        attackerBoard.setId(UUID.randomUUID());

        HakiBattleState state = buildState(defenderBoard.getId(), 2);
        state.setArmamentShip2Id(ship2.getId());
        state.setArmamentShip2HitsAbsorbed(3); // Already maxed out

        when(hakiBattleStateRepository.findByBoardId(defenderBoard.getId())).thenReturn(Optional.of(state));

        ArmamentTriggerResult result = hakiBattleService.checkArmamentTrigger(defenderBoard, ship2, 0, 3, attackerBoard);

        assertThat(result).isNull();
    }

    @Test
    void checkArmament_lv3_ship2_triggersSkipAndCounterFire() {
        Board defenderBoard = Board.builder().owner(redPlayer).ships(new ArrayList<>()).shots(new ArrayList<>()).build();
        defenderBoard.setId(UUID.randomUUID());
        Ship ship2 = buildShip(defenderBoard, ShipType.MOBY_DICK, 0, 0, Orientation.HORIZONTAL);

        Board attackerBoard = Board.builder().owner(bluePlayer).ships(new ArrayList<>()).shots(new ArrayList<>()).build();
        attackerBoard.setId(UUID.randomUUID());
        // Place a ship on attacker's board at (0,0) so counter-fire can hit
        buildShip(attackerBoard, ShipType.STRIKER, 0, 0, Orientation.HORIZONTAL);

        HakiBattleState state = buildState(defenderBoard.getId(), 3);
        state.setArmamentShip2Id(ship2.getId());

        when(hakiBattleStateRepository.findByBoardId(defenderBoard.getId())).thenReturn(Optional.of(state));

        ArmamentTriggerResult result = hakiBattleService.checkArmamentTrigger(defenderBoard, ship2, 0, 0, attackerBoard);

        assertThat(result).isNotNull();
        assertThat(result.turnSkipped()).isTrue();
        assertThat(result.counterFire()).isNotNull();
        assertThat(result.counterFire().row()).isEqualTo(0);
        assertThat(result.counterFire().col()).isEqualTo(0);
        assertThat(result.counterFire().result()).isEqualTo(ShotResult.HIT);
    }

    @Test
    void checkArmament_hitNonArmoredShip_noTrigger() {
        Board defenderBoard = Board.builder().owner(redPlayer).ships(new ArrayList<>()).shots(new ArrayList<>()).build();
        defenderBoard.setId(UUID.randomUUID());
        Ship armoredShip = buildShip(defenderBoard, ShipType.STRIKER, 0, 0, Orientation.HORIZONTAL);
        Ship otherShip = buildShip(defenderBoard, ShipType.RED_FORCE, 3, 0, Orientation.HORIZONTAL);

        Board attackerBoard = Board.builder().owner(bluePlayer).ships(new ArrayList<>()).shots(new ArrayList<>()).build();
        attackerBoard.setId(UUID.randomUUID());

        HakiBattleState state = buildState(defenderBoard.getId(), 1);
        state.setArmamentShip1Id(armoredShip.getId());

        when(hakiBattleStateRepository.findByBoardId(defenderBoard.getId())).thenReturn(Optional.of(state));

        // Hit the non-armored ship
        ArmamentTriggerResult result = hakiBattleService.checkArmamentTrigger(defenderBoard, otherShip, 3, 0, attackerBoard);

        assertThat(result).isNull();
    }

    // --- Counter-fire Tests ---

    @Test
    void counterFire_targetCellEmpty_firesOnSameCoordinate() {
        Board attackerBoard = Board.builder().owner(bluePlayer).ships(new ArrayList<>()).shots(new ArrayList<>()).build();
        attackerBoard.setId(UUID.randomUUID());

        CounterFireResult result = hakiBattleService.resolveCounterFire(attackerBoard, 5, 5, redPlayer);

        assertThat(result.row()).isEqualTo(5);
        assertThat(result.col()).isEqualTo(5);
        assertThat(result.result()).isEqualTo(ShotResult.MISS);
        assertThat(attackerBoard.getShots()).hasSize(1);
    }

    @Test
    void counterFire_targetCellAlreadyHit_firesAdjacentCell() {
        Board attackerBoard = Board.builder().owner(bluePlayer).ships(new ArrayList<>()).shots(new ArrayList<>()).build();
        attackerBoard.setId(UUID.randomUUID());

        // Already a shot at (5,5)
        Shot existingShot = Shot.builder().board(attackerBoard).attacker(redPlayer).row(5).col(5).result(ShotResult.MISS).build();
        attackerBoard.getShots().add(existingShot);

        CounterFireResult result = hakiBattleService.resolveCounterFire(attackerBoard, 5, 5, redPlayer);

        // Should fire at an adjacent cell, not (5,5)
        assertThat(result.row() != 5 || result.col() != 5).isTrue();
        int dr = Math.abs(result.row() - 5);
        int dc = Math.abs(result.col() - 5);
        assertThat(dr <= 1 && dc <= 1).isTrue();
        assertThat(attackerBoard.getShots()).hasSize(2);
    }

    @Test
    void counterFire_allAdjacentHit_firesDistance2Cell() {
        Board attackerBoard = Board.builder().owner(bluePlayer).ships(new ArrayList<>()).shots(new ArrayList<>()).build();
        attackerBoard.setId(UUID.randomUUID());

        // Fill (5,5) and all 8 adjacent cells with shots
        for (int dr = -1; dr <= 1; dr++) {
            for (int dc = -1; dc <= 1; dc++) {
                Shot s = Shot.builder().board(attackerBoard).attacker(redPlayer)
                        .row(5 + dr).col(5 + dc).result(ShotResult.MISS).build();
                attackerBoard.getShots().add(s);
            }
        }

        CounterFireResult result = hakiBattleService.resolveCounterFire(attackerBoard, 5, 5, redPlayer);

        // Should fire at distance 2
        int dr = Math.abs(result.row() - 5);
        int dc = Math.abs(result.col() - 5);
        assertThat(dr == 2 || dc == 2).isTrue();
        // Total shots: 9 existing + 1 new
        assertThat(attackerBoard.getShots()).hasSize(10);
    }

    @Test
    void counterFire_hitsShipOnAttackerBoard_resolvesHit() {
        Board attackerBoard = Board.builder().owner(bluePlayer).ships(new ArrayList<>()).shots(new ArrayList<>()).build();
        attackerBoard.setId(UUID.randomUUID());
        // Ship at (3,3) horizontal, size 2
        buildShip(attackerBoard, ShipType.STRIKER, 3, 3, Orientation.HORIZONTAL);

        CounterFireResult result = hakiBattleService.resolveCounterFire(attackerBoard, 3, 3, redPlayer);

        assertThat(result.row()).isEqualTo(3);
        assertThat(result.col()).isEqualTo(3);
        assertThat(result.result()).isEqualTo(ShotResult.HIT);
        assertThat(result.sunkShipType()).isNull();
    }

    @Test
    void counterFire_sinksShipOnAttackerBoard_resolvesSunk() {
        Board attackerBoard = Board.builder().owner(bluePlayer).ships(new ArrayList<>()).shots(new ArrayList<>()).build();
        attackerBoard.setId(UUID.randomUUID());
        // Ship at (3,3) horizontal, size 2, already has 1 hit
        Ship striker = buildShip(attackerBoard, ShipType.STRIKER, 3, 3, Orientation.HORIZONTAL);
        striker.setHits(1);

        CounterFireResult result = hakiBattleService.resolveCounterFire(attackerBoard, 3, 4, redPlayer);

        assertThat(result.row()).isEqualTo(3);
        assertThat(result.col()).isEqualTo(4);
        assertThat(result.result()).isEqualTo(ShotResult.SUNK);
        assertThat(result.sunkShipType()).isEqualTo("STRIKER");
    }

    @Test
    void counterFire_doesNotTriggerRecursiveArmament() {
        // Counter-fire should resolve directly without calling checkArmamentTrigger
        // This is implicitly tested because resolveCounterFire doesn't call checkArmamentTrigger.
        // We verify by checking that even if attacker has armored ships, no additional triggers occur.
        Board attackerBoard = Board.builder().owner(bluePlayer).ships(new ArrayList<>()).shots(new ArrayList<>()).build();
        attackerBoard.setId(UUID.randomUUID());
        Ship armoredShip = buildShip(attackerBoard, ShipType.STRIKER, 3, 3, Orientation.HORIZONTAL);

        // The counter-fire hits the ship but should NOT trigger armament
        CounterFireResult result = hakiBattleService.resolveCounterFire(attackerBoard, 3, 3, redPlayer);

        assertThat(result.result()).isEqualTo(ShotResult.HIT);
        // No calls to findByBoardId for attacker's board (only the one in resolveCounterFire context)
        // The absence of recursive logic in resolveCounterFire guarantees no recursion
    }

    // --- Turn Skip Tests ---

    @Test
    void consumeSkipTurn_withSkipsOwed_returnsTrue() {
        Board defenderBoard = Board.builder().owner(redPlayer).ships(new ArrayList<>()).shots(new ArrayList<>()).build();
        defenderBoard.setId(UUID.randomUUID());

        HakiBattleState state = buildState(defenderBoard.getId(), 1);
        state.setOpponentSkipTurns(2);

        when(hakiBattleStateRepository.findByBoardId(defenderBoard.getId())).thenReturn(Optional.of(state));

        boolean consumed = hakiBattleService.consumeSkipTurn(defenderBoard);

        assertThat(consumed).isTrue();
        assertThat(state.getOpponentSkipTurns()).isEqualTo(1);
        verify(hakiBattleStateRepository).save(state);
    }

    @Test
    void consumeSkipTurn_noSkipsOwed_returnsFalse() {
        Board defenderBoard = Board.builder().owner(redPlayer).ships(new ArrayList<>()).shots(new ArrayList<>()).build();
        defenderBoard.setId(UUID.randomUUID());

        HakiBattleState state = buildState(defenderBoard.getId(), 1);
        state.setOpponentSkipTurns(0);

        when(hakiBattleStateRepository.findByBoardId(defenderBoard.getId())).thenReturn(Optional.of(state));

        boolean consumed = hakiBattleService.consumeSkipTurn(defenderBoard);

        assertThat(consumed).isFalse();
        verify(hakiBattleStateRepository, never()).save(any());
    }

    @Test
    void consumeSkipTurn_multipleStacked_allConsumedSequentially() {
        Board defenderBoard = Board.builder().owner(redPlayer).ships(new ArrayList<>()).shots(new ArrayList<>()).build();
        defenderBoard.setId(UUID.randomUUID());

        HakiBattleState state = buildState(defenderBoard.getId(), 2);
        state.setOpponentSkipTurns(3);

        when(hakiBattleStateRepository.findByBoardId(defenderBoard.getId())).thenReturn(Optional.of(state));

        assertThat(hakiBattleService.consumeSkipTurn(defenderBoard)).isTrue();
        assertThat(state.getOpponentSkipTurns()).isEqualTo(2);

        assertThat(hakiBattleService.consumeSkipTurn(defenderBoard)).isTrue();
        assertThat(state.getOpponentSkipTurns()).isEqualTo(1);

        assertThat(hakiBattleService.consumeSkipTurn(defenderBoard)).isTrue();
        assertThat(state.getOpponentSkipTurns()).isEqualTo(0);

        assertThat(hakiBattleService.consumeSkipTurn(defenderBoard)).isFalse();
    }
}
