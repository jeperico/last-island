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
import com.last_island.api.domain.haki.dto.ArmamentTriggerResult;
import com.last_island.api.domain.haki.dto.ConquerorsActivationRequest;
import com.last_island.api.domain.haki.dto.ConquerorsActivationResponse;
import com.last_island.api.domain.haki.dto.XPatternShotResult;
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
class HakiConquerorsServiceTest {

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
    private static final String TOKEN = "CONQ123";

    @BeforeEach
    void setUp() {
        bluePlayer = buildUser("Luffy");
        redPlayer = buildUser("Zoro");
    }

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

        Ship striker = Ship.builder()
                .board(redBoard)
                .type(ShipType.STRIKER)
                .orientation(Orientation.HORIZONTAL)
                .row(5).col(5).hits(0)
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

    private HakiBattleState buildConquerorsState(UUID boardId, int level, int usesRemaining, int usesConsumed, int cooldown) {
        HakiBattleState state = HakiBattleState.builder()
                .boardId(boardId)
                .observationLevel(0)
                .observationUsesRemaining(0)
                .observationUsesConsumed(0)
                .conquerorsLevel(level)
                .conquerorsUsesRemaining(usesRemaining)
                .conquerorsUsesConsumed(usesConsumed)
                .conquerorsCooldownTurns(cooldown)
                .hakiUsedThisTurn(false)
                .opponentSkipTurns(0)
                .build();
        state.setId(UUID.randomUUID());
        return state;
    }

    // --- activateConquerors happy path tests ---

    @Test
    void activateConquerors_lv1_weak_setsSkip3() {
        Game game = buildInProgressGame();
        UUID blueBoardId = game.getBlueBoard().getId();
        HakiBattleState state = buildConquerorsState(blueBoardId, 1, 1, 0, 0);

        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));
        when(hakiBattleStateRepository.findByBoardId(blueBoardId)).thenReturn(Optional.of(state));
        when(hakiBattleStateRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        ConquerorsActivationResponse response = hakiBattleService.activateConquerors(
                TOKEN, bluePlayer.getId(), new ConquerorsActivationRequest(null, null));

        assertThat(response.skipTurns()).isEqualTo(3);
        assertThat(response.effectLevel()).isEqualTo("WEAK");
        assertThat(response.xPatternShots()).isNull();
        assertThat(state.getConquerorsUsesRemaining()).isEqualTo(0);
        assertThat(state.getConquerorsUsesConsumed()).isEqualTo(1);
        assertThat(state.isHakiUsedThisTurn()).isTrue();
        assertThat(state.getOpponentSkipTurns()).isEqualTo(3);
    }

    @Test
    void activateConquerors_lv2_firstStrong_secondWeak() {
        Game game = buildInProgressGame();
        UUID blueBoardId = game.getBlueBoard().getId();
        HakiBattleState state = buildConquerorsState(blueBoardId, 2, 2, 0, 0);

        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));
        when(hakiBattleStateRepository.findByBoardId(blueBoardId)).thenReturn(Optional.of(state));
        when(hakiBattleStateRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        // First use — STRONG (level 2, consumed=0)
        ConquerorsActivationResponse response1 = hakiBattleService.activateConquerors(
                TOKEN, bluePlayer.getId(), new ConquerorsActivationRequest(null, null));

        assertThat(response1.effectLevel()).isEqualTo("STRONG");
        assertThat(response1.skipTurns()).isEqualTo(5);
        assertThat(state.getOpponentSkipTurns()).isEqualTo(5);

        // Reset for second use
        state.setHakiUsedThisTurn(false);
        state.setOpponentSkipTurns(0);
        state.setConquerorsCooldownTurns(0);

        // Second use — WEAK (consumed > 0)
        ConquerorsActivationResponse response2 = hakiBattleService.activateConquerors(
                TOKEN, bluePlayer.getId(), new ConquerorsActivationRequest(null, null));

        assertThat(response2.effectLevel()).isEqualTo("WEAK");
        assertThat(response2.skipTurns()).isEqualTo(3);
        assertThat(state.getOpponentSkipTurns()).isEqualTo(3);
        assertThat(state.getConquerorsUsesRemaining()).isEqualTo(0);
        assertThat(state.getConquerorsUsesConsumed()).isEqualTo(2);
    }

    @Test
    void activateConquerors_lv3_awakened_firesXPattern() {
        Game game = buildInProgressGame();
        UUID blueBoardId = game.getBlueBoard().getId();
        // First use already consumed (weak), now second use (awakened)
        HakiBattleState state = buildConquerorsState(blueBoardId, 3, 1, 1, 0);

        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));
        when(hakiBattleStateRepository.findByBoardId(blueBoardId)).thenReturn(Optional.of(state));
        when(hakiBattleStateRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        // Center at (5,5) — striker is at (5,5)-(5,6)
        // Diagonals: (4,4), (4,6), (6,4), (6,6) — all valid, all miss
        ConquerorsActivationResponse response = hakiBattleService.activateConquerors(
                TOKEN, bluePlayer.getId(), new ConquerorsActivationRequest(5, 5));

        assertThat(response.effectLevel()).isEqualTo("AWAKENED");
        assertThat(response.skipTurns()).isEqualTo(5);
        assertThat(response.xPatternShots()).hasSize(4);
        // All diagonals are misses (striker at (5,5)-(5,6), diagonals don't hit it)
        assertThat(response.xPatternShots().stream().allMatch(s -> s.result() == ShotResult.MISS)).isTrue();
    }

    @Test
    void activateConquerors_lv3_awakened_xPatternOutOfBounds() {
        Game game = buildInProgressGame();
        UUID blueBoardId = game.getBlueBoard().getId();
        HakiBattleState state = buildConquerorsState(blueBoardId, 3, 1, 1, 0);

        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));
        when(hakiBattleStateRepository.findByBoardId(blueBoardId)).thenReturn(Optional.of(state));
        when(hakiBattleStateRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        // Center at (0,0) — only (1,1) diagonal is valid
        ConquerorsActivationResponse response = hakiBattleService.activateConquerors(
                TOKEN, bluePlayer.getId(), new ConquerorsActivationRequest(0, 0));

        assertThat(response.xPatternShots()).hasSize(1);
        assertThat(response.xPatternShots().get(0).row()).isEqualTo(1);
        assertThat(response.xPatternShots().get(0).col()).isEqualTo(1);
    }

    // --- activateConquerors validation tests ---

    @Test
    void activateConquerors_failsWhenNotYourTurn() {
        Game game = buildInProgressGame();
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> hakiBattleService.activateConquerors(TOKEN, redPlayer.getId(), new ConquerorsActivationRequest(null, null)));
        assertThat(ex.getStatusCode().value()).isEqualTo(409);
    }

    @Test
    void activateConquerors_failsWhenHakiAlreadyUsed() {
        Game game = buildInProgressGame();
        UUID blueBoardId = game.getBlueBoard().getId();
        HakiBattleState state = buildConquerorsState(blueBoardId, 1, 1, 0, 0);
        state.setHakiUsedThisTurn(true);

        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));
        when(hakiBattleStateRepository.findByBoardId(blueBoardId)).thenReturn(Optional.of(state));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> hakiBattleService.activateConquerors(TOKEN, bluePlayer.getId(), new ConquerorsActivationRequest(null, null)));
        assertThat(ex.getStatusCode().value()).isEqualTo(400);
    }

    @Test
    void activateConquerors_failsWhenNoUsesRemaining() {
        Game game = buildInProgressGame();
        UUID blueBoardId = game.getBlueBoard().getId();
        HakiBattleState state = buildConquerorsState(blueBoardId, 1, 0, 1, 0);

        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));
        when(hakiBattleStateRepository.findByBoardId(blueBoardId)).thenReturn(Optional.of(state));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> hakiBattleService.activateConquerors(TOKEN, bluePlayer.getId(), new ConquerorsActivationRequest(null, null)));
        assertThat(ex.getStatusCode().value()).isEqualTo(400);
    }

    @Test
    void activateConquerors_failsWhenOnCooldown() {
        Game game = buildInProgressGame();
        UUID blueBoardId = game.getBlueBoard().getId();
        HakiBattleState state = buildConquerorsState(blueBoardId, 2, 1, 1, 2);

        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));
        when(hakiBattleStateRepository.findByBoardId(blueBoardId)).thenReturn(Optional.of(state));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> hakiBattleService.activateConquerors(TOKEN, bluePlayer.getId(), new ConquerorsActivationRequest(null, null)));
        assertThat(ex.getStatusCode().value()).isEqualTo(400);
    }

    @Test
    void activateConquerors_failsWhenNotUnlocked() {
        Game game = buildInProgressGame();
        UUID blueBoardId = game.getBlueBoard().getId();
        HakiBattleState state = buildConquerorsState(blueBoardId, 0, 0, 0, 0);

        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));
        when(hakiBattleStateRepository.findByBoardId(blueBoardId)).thenReturn(Optional.of(state));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> hakiBattleService.activateConquerors(TOKEN, bluePlayer.getId(), new ConquerorsActivationRequest(null, null)));
        assertThat(ex.getStatusCode().value()).isEqualTo(400);
    }

    @Test
    void activateConquerors_failsWhenGameNotInProgress() {
        Game game = buildInProgressGame();
        game.setPhase(GamePhase.PLACING_SHIPS);
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> hakiBattleService.activateConquerors(TOKEN, bluePlayer.getId(), new ConquerorsActivationRequest(null, null)));
        assertThat(ex.getStatusCode().value()).isEqualTo(400);
    }

    @Test
    void activateConquerors_lv3_awakened_requiresRowCol() {
        Game game = buildInProgressGame();
        UUID blueBoardId = game.getBlueBoard().getId();
        HakiBattleState state = buildConquerorsState(blueBoardId, 3, 1, 1, 0);

        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));
        when(hakiBattleStateRepository.findByBoardId(blueBoardId)).thenReturn(Optional.of(state));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> hakiBattleService.activateConquerors(TOKEN, bluePlayer.getId(), new ConquerorsActivationRequest(null, null)));
        assertThat(ex.getStatusCode().value()).isEqualTo(400);
        assertThat(ex.getReason()).contains("row and col");
    }

    // --- consumeSkipTurn cooldown tests ---

    @Test
    void consumeSkipTurn_setsCooldownWhenSkipsExhausted_weak() {
        Board board = Board.builder().owner(bluePlayer).ships(new ArrayList<>()).shots(new ArrayList<>()).build();
        board.setId(UUID.randomUUID());

        HakiBattleState state = buildConquerorsState(board.getId(), 1, 0, 1, 0);
        state.setOpponentSkipTurns(1); // Last skip about to be consumed

        when(hakiBattleStateRepository.findByBoardId(board.getId())).thenReturn(Optional.of(state));
        when(hakiBattleStateRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        boolean consumed = hakiBattleService.consumeSkipTurn(board);

        assertThat(consumed).isTrue();
        assertThat(state.getOpponentSkipTurns()).isEqualTo(0);
        assertThat(state.getConquerorsCooldownTurns()).isEqualTo(1); // weak = cooldown 1
    }

    @Test
    void consumeSkipTurn_setsCooldownWhenSkipsExhausted_strong() {
        Board board = Board.builder().owner(bluePlayer).ships(new ArrayList<>()).shots(new ArrayList<>()).build();
        board.setId(UUID.randomUUID());

        HakiBattleState state = buildConquerorsState(board.getId(), 2, 0, 2, 0);
        state.setOpponentSkipTurns(1); // Last skip about to be consumed

        when(hakiBattleStateRepository.findByBoardId(board.getId())).thenReturn(Optional.of(state));
        when(hakiBattleStateRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        boolean consumed = hakiBattleService.consumeSkipTurn(board);

        assertThat(consumed).isTrue();
        assertThat(state.getOpponentSkipTurns()).isEqualTo(0);
        assertThat(state.getConquerorsCooldownTurns()).isEqualTo(2); // strong = cooldown 2
    }

    // --- resetHakiUsedThisTurn cooldown decrement tests ---

    @Test
    void resetHakiUsedThisTurn_decrementsCooldown() {
        UUID boardId = UUID.randomUUID();
        HakiBattleState state = buildConquerorsState(boardId, 2, 1, 1, 2);
        state.setHakiUsedThisTurn(true);

        when(hakiBattleStateRepository.findByBoardId(boardId)).thenReturn(Optional.of(state));
        when(hakiBattleStateRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        hakiBattleService.resetHakiUsedThisTurn(boardId);
        assertThat(state.getConquerorsCooldownTurns()).isEqualTo(1);
        assertThat(state.isHakiUsedThisTurn()).isFalse();

        state.setHakiUsedThisTurn(true);
        hakiBattleService.resetHakiUsedThisTurn(boardId);
        assertThat(state.getConquerorsCooldownTurns()).isEqualTo(0);
    }

    @Test
    void resetHakiUsedThisTurn_noCooldownDecrementDuringSkipWindow() {
        UUID boardId = UUID.randomUUID();
        HakiBattleState state = buildConquerorsState(boardId, 2, 1, 1, 2);
        state.setOpponentSkipTurns(3); // Skip window active
        state.setHakiUsedThisTurn(true);

        when(hakiBattleStateRepository.findByBoardId(boardId)).thenReturn(Optional.of(state));
        when(hakiBattleStateRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        hakiBattleService.resetHakiUsedThisTurn(boardId);

        assertThat(state.getConquerorsCooldownTurns()).isEqualTo(2); // No decrement
    }

    // --- Armament + Conqueror's interaction tests ---

    @Test
    void armamentTrigger_duringConquerorsWindow_doesNotTouchSkipTurns() {
        Board defenderBoard = Board.builder().owner(redPlayer).ships(new ArrayList<>()).shots(new ArrayList<>()).build();
        defenderBoard.setId(UUID.randomUUID());

        Board attackerBoard = Board.builder().owner(bluePlayer).ships(new ArrayList<>()).shots(new ArrayList<>()).build();
        attackerBoard.setId(UUID.randomUUID());

        Ship armoredShip = Ship.builder()
                .board(defenderBoard).type(ShipType.STRIKER)
                .orientation(Orientation.HORIZONTAL).row(0).col(0).hits(0).build();
        armoredShip.setId(UUID.randomUUID());
        defenderBoard.getShips().add(armoredShip);

        // Defender state with armament ship1 assigned
        HakiBattleState defenderState = buildConquerorsState(defenderBoard.getId(), 0, 0, 0, 0);
        defenderState.setArmamentLevel(1);
        defenderState.setArmamentShip1Id(armoredShip.getId());
        defenderState.setArmamentShip1HitsAbsorbed(0);

        // Attacker state with Conqueror's window active
        HakiBattleState attackerState = buildConquerorsState(attackerBoard.getId(), 1, 0, 1, 0);
        attackerState.setOpponentSkipTurns(3); // Conqueror's window active

        when(hakiBattleStateRepository.findByBoardId(defenderBoard.getId())).thenReturn(Optional.of(defenderState));
        when(hakiBattleStateRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        ArmamentTriggerResult result = hakiBattleService.checkArmamentTrigger(defenderBoard, armoredShip, 0, 0, attackerBoard);

        // Armament triggers (non-null result) but does NOT touch opponentSkipTurns
        assertThat(result).isNotNull();
        assertThat(attackerState.getOpponentSkipTurns()).isEqualTo(3); // Unchanged
        assertThat(defenderState.getOpponentSkipTurns()).isEqualTo(0); // Unchanged
    }

    @Test
    void armamentTrigger_outsideConquerorsWindow_doesNotTouchSkipTurns() {
        Board defenderBoard = Board.builder().owner(redPlayer).ships(new ArrayList<>()).shots(new ArrayList<>()).build();
        defenderBoard.setId(UUID.randomUUID());

        Board attackerBoard = Board.builder().owner(bluePlayer).ships(new ArrayList<>()).shots(new ArrayList<>()).build();
        attackerBoard.setId(UUID.randomUUID());

        Ship armoredShip = Ship.builder()
                .board(defenderBoard).type(ShipType.STRIKER)
                .orientation(Orientation.HORIZONTAL).row(0).col(0).hits(0).build();
        armoredShip.setId(UUID.randomUUID());
        defenderBoard.getShips().add(armoredShip);

        HakiBattleState defenderState = buildConquerorsState(defenderBoard.getId(), 0, 0, 0, 0);
        defenderState.setArmamentLevel(1);
        defenderState.setArmamentShip1Id(armoredShip.getId());
        defenderState.setArmamentShip1HitsAbsorbed(0);

        // Attacker state with NO Conqueror's window
        HakiBattleState attackerState = buildConquerorsState(attackerBoard.getId(), 0, 0, 0, 0);
        attackerState.setOpponentSkipTurns(0);

        when(hakiBattleStateRepository.findByBoardId(defenderBoard.getId())).thenReturn(Optional.of(defenderState));
        when(hakiBattleStateRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        ArmamentTriggerResult result = hakiBattleService.checkArmamentTrigger(defenderBoard, armoredShip, 0, 0, attackerBoard);

        // Armament triggers but does NOT modify opponentSkipTurns
        assertThat(result).isNotNull();
        assertThat(defenderState.getOpponentSkipTurns()).isEqualTo(0);
        assertThat(attackerState.getOpponentSkipTurns()).isEqualTo(0);
    }

    // --- initializeForBoard tests ---

    @Test
    void initializeForBoard_setsConquerorsUsesBasedOnLevel() {
        // Lv1 → 1 use
        Board board1 = Board.builder().owner(bluePlayer).ships(new ArrayList<>()).shots(new ArrayList<>()).build();
        board1.setId(UUID.randomUUID());

        HakiProfile profile1 = HakiProfile.builder().userId(bluePlayer.getId())
                .observationLevel(0).armamentLevel(0).conquerorsLevel(1).build();
        when(hakiProfileRepository.findByUserId(bluePlayer.getId())).thenReturn(Optional.of(profile1));
        when(hakiBattleStateRepository.findByBoardId(board1.getId())).thenReturn(Optional.empty());
        when(hakiBattleStateRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        hakiBattleService.initializeForBoard(board1);

        ArgumentCaptor<HakiBattleState> captor = ArgumentCaptor.forClass(HakiBattleState.class);
        verify(hakiBattleStateRepository).save(captor.capture());
        assertThat(captor.getValue().getConquerorsLevel()).isEqualTo(1);
        assertThat(captor.getValue().getConquerorsUsesRemaining()).isEqualTo(1);

        // Lv2 → 2 uses
        reset(hakiBattleStateRepository, hakiProfileRepository);
        Board board2 = Board.builder().owner(redPlayer).ships(new ArrayList<>()).shots(new ArrayList<>()).build();
        board2.setId(UUID.randomUUID());

        HakiProfile profile2 = HakiProfile.builder().userId(redPlayer.getId())
                .observationLevel(0).armamentLevel(0).conquerorsLevel(2).build();
        when(hakiProfileRepository.findByUserId(redPlayer.getId())).thenReturn(Optional.of(profile2));
        when(hakiBattleStateRepository.findByBoardId(board2.getId())).thenReturn(Optional.empty());
        when(hakiBattleStateRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        hakiBattleService.initializeForBoard(board2);

        ArgumentCaptor<HakiBattleState> captor2 = ArgumentCaptor.forClass(HakiBattleState.class);
        verify(hakiBattleStateRepository).save(captor2.capture());
        assertThat(captor2.getValue().getConquerorsLevel()).isEqualTo(2);
        assertThat(captor2.getValue().getConquerorsUsesRemaining()).isEqualTo(2);
    }

    // --- X-pattern additional tests ---

    @Test
    void activateConquerors_xPattern_skipsDuplicateShots() {
        Game game = buildInProgressGame();
        UUID blueBoardId = game.getBlueBoard().getId();
        HakiBattleState state = buildConquerorsState(blueBoardId, 3, 1, 1, 0);

        // Add existing shots at diagonal positions
        Board redBoard = game.getRedBoard();
        Shot existingShot = Shot.builder().board(redBoard).attacker(bluePlayer).row(4).col(4).result(ShotResult.MISS).build();
        redBoard.getShots().add(existingShot);
        Shot existingShot2 = Shot.builder().board(redBoard).attacker(bluePlayer).row(4).col(6).result(ShotResult.MISS).build();
        redBoard.getShots().add(existingShot2);

        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));
        when(hakiBattleStateRepository.findByBoardId(blueBoardId)).thenReturn(Optional.of(state));
        when(hakiBattleStateRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        // Center at (5,5), diagonals: (4,4), (4,6), (6,4), (6,6)
        // (4,4) and (4,6) already hit → skipped
        ConquerorsActivationResponse response = hakiBattleService.activateConquerors(
                TOKEN, bluePlayer.getId(), new ConquerorsActivationRequest(5, 5));

        assertThat(response.xPatternShots()).hasSize(2); // Only (6,4) and (6,6) fire
    }

    @Test
    void activateConquerors_xPattern_checksWinCondition() {
        Game game = buildInProgressGame();
        UUID blueBoardId = game.getBlueBoard().getId();
        HakiBattleState state = buildConquerorsState(blueBoardId, 3, 1, 1, 0);

        // Replace red board ships with a single ship at a diagonal position
        Board redBoard = game.getRedBoard();
        redBoard.getShips().clear();
        Ship tinyShip = Ship.builder()
                .board(redBoard).type(ShipType.STRIKER)
                .orientation(Orientation.HORIZONTAL).row(4).col(4).hits(1) // 1 hit already, size=2
                .build();
        tinyShip.setId(UUID.randomUUID());
        redBoard.getShips().add(tinyShip);
        // Second cell of striker at (4,5) — but we hit (4,4) via X-pattern diagonal

        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));
        when(hakiBattleStateRepository.findByBoardId(blueBoardId)).thenReturn(Optional.of(state));
        when(hakiBattleStateRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        // Center at (5,5), diagonal (4,4) hits the striker's first cell → sinks it (already had 1 hit, size=2)
        ConquerorsActivationResponse response = hakiBattleService.activateConquerors(
                TOKEN, bluePlayer.getId(), new ConquerorsActivationRequest(5, 5));

        // The ship should be sunk and game should be finished
        assertThat(tinyShip.isSunk()).isTrue();
        assertThat(game.getPhase()).isEqualTo(GamePhase.FINISHED);
        assertThat(response.xPatternShots().stream().anyMatch(s -> s.result() == ShotResult.SUNK)).isTrue();
    }

    @Test
    void activateConquerors_xPattern_triggersArmament_eatsSkip() {
        Game game = buildInProgressGame();
        UUID blueBoardId = game.getBlueBoard().getId();
        UUID redBoardId = game.getRedBoard().getId();

        // Blue player state: Conqueror's Lv3, second use (awakened)
        HakiBattleState blueState = buildConquerorsState(blueBoardId, 3, 1, 1, 0);

        // Place an armored ship at (4,4) on red board
        Board redBoard = game.getRedBoard();
        redBoard.getShips().clear();
        Ship armoredShip = Ship.builder()
                .board(redBoard).type(ShipType.MOBY_DICK) // size=4
                .orientation(Orientation.HORIZONTAL).row(4).col(4).hits(0)
                .build();
        armoredShip.setId(UUID.randomUUID());
        redBoard.getShips().add(armoredShip);

        // Red defender state with armament on the ship
        HakiBattleState redState = buildConquerorsState(redBoardId, 0, 0, 0, 0);
        redState.setArmamentLevel(1);
        redState.setArmamentShip1Id(armoredShip.getId());
        redState.setArmamentShip1HitsAbsorbed(0);

        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));
        when(hakiBattleStateRepository.findByBoardId(blueBoardId)).thenReturn(Optional.of(blueState));
        when(hakiBattleStateRepository.findByBoardId(redBoardId)).thenReturn(Optional.of(redState));
        when(hakiBattleStateRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        // Center at (5,5), diagonal (4,4) hits armoredShip
        ConquerorsActivationResponse response = hakiBattleService.activateConquerors(
                TOKEN, bluePlayer.getId(), new ConquerorsActivationRequest(5, 5));

        // The X-pattern hit triggers armament (absorption tracking) but does NOT eat skip turns
        // blueState.opponentSkipTurns stays at 5 (awakened) — Armament no longer touches opponentSkipTurns
        assertThat(blueState.getOpponentSkipTurns()).isEqualTo(5);
        assertThat(response.xPatternShots().stream().anyMatch(s -> s.result() == ShotResult.HIT)).isTrue();
    }

    // --- SSE emission test ---

    @Test
    void activateConquerors_emitsSSEToOpponent() {
        Game game = buildInProgressGame();
        UUID blueBoardId = game.getBlueBoard().getId();
        HakiBattleState state = buildConquerorsState(blueBoardId, 1, 1, 0, 0);

        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));
        when(hakiBattleStateRepository.findByBoardId(blueBoardId)).thenReturn(Optional.of(state));
        when(hakiBattleStateRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        hakiBattleService.activateConquerors(TOKEN, bluePlayer.getId(), new ConquerorsActivationRequest(null, null));

        verify(gameEventEmitter).emitConquerorsHakiUsed(TOKEN, redPlayer.getId(), 3, "WEAK");
    }
}
