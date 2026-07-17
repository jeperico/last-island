package com.last_island.api.domain.haki.service;

import com.last_island.api.domain.board.entity.Board;
import com.last_island.api.domain.board.entity.Ship;
import com.last_island.api.domain.board.enums.Orientation;
import com.last_island.api.domain.board.enums.ShipType;
import com.last_island.api.domain.game.entity.Game;
import com.last_island.api.domain.game.enums.GamePhase;
import com.last_island.api.domain.game.repository.GameRepository;
import com.last_island.api.domain.haki.dto.ObservationRequest;
import com.last_island.api.domain.haki.dto.ObservationResponse;
import com.last_island.api.domain.haki.dto.RevealedCell;
import com.last_island.api.domain.haki.entity.HakiBattleState;
import com.last_island.api.domain.haki.entity.HakiProfile;
import com.last_island.api.domain.haki.enums.CellRevealStatus;
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
class HakiBattleServiceTest {

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
    private static final String TOKEN = "ABC123";

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

        // Place a STRIKER (size=2) on red's board at (0,0) HORIZONTAL → occupies (0,0) and (0,1)
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

    private HakiBattleState buildState(UUID boardId, int level, int usesRemaining, int usesConsumed) {
        HakiBattleState state = HakiBattleState.builder()
                .boardId(boardId)
                .observationLevel(level)
                .observationUsesRemaining(usesRemaining)
                .observationUsesConsumed(usesConsumed)
                .conquerorsUsesRemaining(0)
                .hakiUsedThisTurn(false)
                .build();
        state.setId(UUID.randomUUID());
        return state;
    }

    // --- initializeHakiBattleStates tests ---

    @Test
    void initializesCorrectly_lv0() {
        Game game = buildInProgressGame();
        HakiProfile blueProfile = HakiProfile.builder().userId(bluePlayer.getId()).observationLevel(0).build();
        HakiProfile redProfile = HakiProfile.builder().userId(redPlayer.getId()).observationLevel(0).build();

        when(hakiProfileRepository.findByUserId(bluePlayer.getId())).thenReturn(Optional.of(blueProfile));
        when(hakiProfileRepository.findByUserId(redPlayer.getId())).thenReturn(Optional.of(redProfile));
        when(hakiBattleStateRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        hakiBattleService.initializeHakiBattleStates(game);

        ArgumentCaptor<HakiBattleState> captor = ArgumentCaptor.forClass(HakiBattleState.class);
        verify(hakiBattleStateRepository, times(2)).save(captor.capture());

        for (HakiBattleState state : captor.getAllValues()) {
            assertThat(state.getObservationUsesRemaining()).isEqualTo(0);
            assertThat(state.getObservationLevel()).isEqualTo(0);
        }
    }

    @Test
    void initializesCorrectly_lv1() {
        Game game = buildInProgressGame();
        HakiProfile blueProfile = HakiProfile.builder().userId(bluePlayer.getId()).observationLevel(1).build();
        HakiProfile redProfile = HakiProfile.builder().userId(redPlayer.getId()).observationLevel(0).build();

        when(hakiProfileRepository.findByUserId(bluePlayer.getId())).thenReturn(Optional.of(blueProfile));
        when(hakiProfileRepository.findByUserId(redPlayer.getId())).thenReturn(Optional.of(redProfile));
        when(hakiBattleStateRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        hakiBattleService.initializeHakiBattleStates(game);

        ArgumentCaptor<HakiBattleState> captor = ArgumentCaptor.forClass(HakiBattleState.class);
        verify(hakiBattleStateRepository, times(2)).save(captor.capture());

        HakiBattleState blueState = captor.getAllValues().stream()
                .filter(s -> s.getBoardId().equals(game.getBlueBoard().getId()))
                .findFirst().orElseThrow();
        assertThat(blueState.getObservationUsesRemaining()).isEqualTo(1);
        assertThat(blueState.getObservationLevel()).isEqualTo(1);
    }

    @Test
    void initializesCorrectly_lv2() {
        Game game = buildInProgressGame();
        HakiProfile blueProfile = HakiProfile.builder().userId(bluePlayer.getId()).observationLevel(2).build();
        HakiProfile redProfile = HakiProfile.builder().userId(redPlayer.getId()).observationLevel(0).build();

        when(hakiProfileRepository.findByUserId(bluePlayer.getId())).thenReturn(Optional.of(blueProfile));
        when(hakiProfileRepository.findByUserId(redPlayer.getId())).thenReturn(Optional.of(redProfile));
        when(hakiBattleStateRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        hakiBattleService.initializeHakiBattleStates(game);

        ArgumentCaptor<HakiBattleState> captor = ArgumentCaptor.forClass(HakiBattleState.class);
        verify(hakiBattleStateRepository, times(2)).save(captor.capture());

        HakiBattleState blueState = captor.getAllValues().stream()
                .filter(s -> s.getBoardId().equals(game.getBlueBoard().getId()))
                .findFirst().orElseThrow();
        assertThat(blueState.getObservationUsesRemaining()).isEqualTo(2);
        assertThat(blueState.getObservationLevel()).isEqualTo(2);
    }

    @Test
    void initializesCorrectly_lv3() {
        Game game = buildInProgressGame();
        HakiProfile blueProfile = HakiProfile.builder().userId(bluePlayer.getId()).observationLevel(3).build();
        HakiProfile redProfile = HakiProfile.builder().userId(redPlayer.getId()).observationLevel(0).build();

        when(hakiProfileRepository.findByUserId(bluePlayer.getId())).thenReturn(Optional.of(blueProfile));
        when(hakiProfileRepository.findByUserId(redPlayer.getId())).thenReturn(Optional.of(redProfile));
        when(hakiBattleStateRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        hakiBattleService.initializeHakiBattleStates(game);

        ArgumentCaptor<HakiBattleState> captor = ArgumentCaptor.forClass(HakiBattleState.class);
        verify(hakiBattleStateRepository, times(2)).save(captor.capture());

        HakiBattleState blueState = captor.getAllValues().stream()
                .filter(s -> s.getBoardId().equals(game.getBlueBoard().getId()))
                .findFirst().orElseThrow();
        assertThat(blueState.getObservationUsesRemaining()).isEqualTo(2);
        assertThat(blueState.getObservationLevel()).isEqualTo(3);
    }

    // --- activateObservation tests ---

    @Test
    void lv1_singleUse_reveals2x2() {
        Game game = buildInProgressGame();
        UUID blueBoardId = game.getBlueBoard().getId();
        HakiBattleState state = buildState(blueBoardId, 1, 1, 0);

        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));
        when(hakiBattleStateRepository.findByBoardId(blueBoardId)).thenReturn(Optional.of(state));
        when(hakiBattleStateRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        ObservationRequest request = new ObservationRequest(0, 0, null, null);
        ObservationResponse response = hakiBattleService.activateObservation(TOKEN, bluePlayer.getId(), request);

        assertThat(response.effectLevel()).isEqualTo("WEAK");
        assertThat(response.revealedCells()).hasSize(4);

        // (0,0) and (0,1) should be HAS_SHIP (striker on red board at row=0, col=0 HORIZONTAL, size=2)
        assertThat(response.revealedCells().stream()
                .filter(c -> c.status() == CellRevealStatus.HAS_SHIP).count()).isEqualTo(2);
        assertThat(response.revealedCells().stream()
                .filter(c -> c.status() == CellRevealStatus.EMPTY).count()).isEqualTo(2);

        assertThat(state.getObservationUsesRemaining()).isEqualTo(0);
        assertThat(state.getObservationUsesConsumed()).isEqualTo(1);
        assertThat(state.isHakiUsedThisTurn()).isTrue();
    }

    @Test
    void lv1_secondUseRejected() {
        Game game = buildInProgressGame();
        UUID blueBoardId = game.getBlueBoard().getId();
        HakiBattleState state = buildState(blueBoardId, 1, 0, 1);

        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));
        when(hakiBattleStateRepository.findByBoardId(blueBoardId)).thenReturn(Optional.of(state));

        ObservationRequest request = new ObservationRequest(0, 0, null, null);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> hakiBattleService.activateObservation(TOKEN, bluePlayer.getId(), request));
        assertThat(ex.getStatusCode().value()).isEqualTo(400);
    }

    @Test
    void lv2_firstUseWeak_secondUseStrong() {
        Game game = buildInProgressGame();
        UUID blueBoardId = game.getBlueBoard().getId();

        // First use
        HakiBattleState state = buildState(blueBoardId, 2, 2, 0);
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));
        when(hakiBattleStateRepository.findByBoardId(blueBoardId)).thenReturn(Optional.of(state));
        when(hakiBattleStateRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        ObservationRequest request1 = new ObservationRequest(0, 0, null, null);
        ObservationResponse response1 = hakiBattleService.activateObservation(TOKEN, bluePlayer.getId(), request1);

        assertThat(response1.effectLevel()).isEqualTo("WEAK");
        assertThat(response1.revealedCells()).hasSize(4);

        // Second use — reset flag for new turn
        state.setHakiUsedThisTurn(false);

        ObservationRequest request2 = new ObservationRequest(0, 0, null, null);
        ObservationResponse response2 = hakiBattleService.activateObservation(TOKEN, bluePlayer.getId(), request2);

        assertThat(response2.effectLevel()).isEqualTo("STRONG");
        assertThat(response2.revealedCells()).hasSize(9);
    }

    @Test
    void lv2_thirdUseRejected() {
        Game game = buildInProgressGame();
        UUID blueBoardId = game.getBlueBoard().getId();
        HakiBattleState state = buildState(blueBoardId, 2, 0, 2);

        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));
        when(hakiBattleStateRepository.findByBoardId(blueBoardId)).thenReturn(Optional.of(state));

        ObservationRequest request = new ObservationRequest(0, 0, null, null);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> hakiBattleService.activateObservation(TOKEN, bluePlayer.getId(), request));
        assertThat(ex.getStatusCode().value()).isEqualTo(400);
    }

    @Test
    void lv3_firstUseWeak_secondUseAwakened() {
        Game game = buildInProgressGame();
        UUID blueBoardId = game.getBlueBoard().getId();

        HakiBattleState state = buildState(blueBoardId, 3, 2, 0);
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));
        when(hakiBattleStateRepository.findByBoardId(blueBoardId)).thenReturn(Optional.of(state));
        when(hakiBattleStateRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        // First use — WEAK 2×2
        ObservationRequest request1 = new ObservationRequest(0, 0, null, null);
        ObservationResponse response1 = hakiBattleService.activateObservation(TOKEN, bluePlayer.getId(), request1);
        assertThat(response1.effectLevel()).isEqualTo("WEAK");
        assertThat(response1.revealedCells()).hasSize(4);

        // Second use — AWAKENED 3×3 + full row
        state.setHakiUsedThisTurn(false);
        ObservationRequest request2 = new ObservationRequest(0, 0, 5, null);
        ObservationResponse response2 = hakiBattleService.activateObservation(TOKEN, bluePlayer.getId(), request2);

        assertThat(response2.effectLevel()).isEqualTo("AWAKENED");
        // 3×3 = 9 cells + row 5 = 10 cells, but some may overlap. Row 5 cols 0-2 overlap with area if area starts at (0,0)
        // Area (0,0)-(2,2) does NOT overlap with row 5, so total = 9 + 10 = 19
        assertThat(response2.revealedCells()).hasSize(19);
    }

    @Test
    void lv3_awakenedWithColumn() {
        Game game = buildInProgressGame();
        UUID blueBoardId = game.getBlueBoard().getId();

        HakiBattleState state = buildState(blueBoardId, 3, 1, 1);
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));
        when(hakiBattleStateRepository.findByBoardId(blueBoardId)).thenReturn(Optional.of(state));
        when(hakiBattleStateRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        // AWAKENED with column reveal — area (0,0)-(2,2) + col 5, no overlap → 9 + 10 = 19
        ObservationRequest request = new ObservationRequest(0, 0, null, 5);
        ObservationResponse response = hakiBattleService.activateObservation(TOKEN, bluePlayer.getId(), request);

        assertThat(response.effectLevel()).isEqualTo("AWAKENED");
        assertThat(response.revealedCells()).hasSize(19);
    }

    @Test
    void lv3_awakenedMissingRowCol() {
        Game game = buildInProgressGame();
        UUID blueBoardId = game.getBlueBoard().getId();

        HakiBattleState state = buildState(blueBoardId, 3, 1, 1);
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));
        when(hakiBattleStateRepository.findByBoardId(blueBoardId)).thenReturn(Optional.of(state));

        // Neither revealRowIndex nor revealColIndex provided
        ObservationRequest request = new ObservationRequest(0, 0, null, null);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> hakiBattleService.activateObservation(TOKEN, bluePlayer.getId(), request));
        assertThat(ex.getStatusCode().value()).isEqualTo(400);
    }

    @Test
    void notYourTurn_409() {
        Game game = buildInProgressGame();
        // Current turn is bluePlayer; red tries to activate
        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));

        ObservationRequest request = new ObservationRequest(0, 0, null, null);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> hakiBattleService.activateObservation(TOKEN, redPlayer.getId(), request));
        assertThat(ex.getStatusCode().value()).isEqualTo(409);
    }

    @Test
    void hakiAlreadyUsedThisTurn_400() {
        Game game = buildInProgressGame();
        UUID blueBoardId = game.getBlueBoard().getId();
        HakiBattleState state = buildState(blueBoardId, 2, 2, 0);
        state.setHakiUsedThisTurn(true);

        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));
        when(hakiBattleStateRepository.findByBoardId(blueBoardId)).thenReturn(Optional.of(state));

        ObservationRequest request = new ObservationRequest(0, 0, null, null);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> hakiBattleService.activateObservation(TOKEN, bluePlayer.getId(), request));
        assertThat(ex.getStatusCode().value()).isEqualTo(400);
    }

    @Test
    void observationLevelZero_400() {
        Game game = buildInProgressGame();
        UUID blueBoardId = game.getBlueBoard().getId();
        HakiBattleState state = buildState(blueBoardId, 0, 0, 0);

        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));
        when(hakiBattleStateRepository.findByBoardId(blueBoardId)).thenReturn(Optional.of(state));

        ObservationRequest request = new ObservationRequest(0, 0, null, null);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> hakiBattleService.activateObservation(TOKEN, bluePlayer.getId(), request));
        assertThat(ex.getStatusCode().value()).isEqualTo(400);
    }

    @Test
    void noUsesRemaining_400() {
        Game game = buildInProgressGame();
        UUID blueBoardId = game.getBlueBoard().getId();
        HakiBattleState state = buildState(blueBoardId, 1, 0, 1);

        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));
        when(hakiBattleStateRepository.findByBoardId(blueBoardId)).thenReturn(Optional.of(state));

        ObservationRequest request = new ObservationRequest(0, 0, null, null);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> hakiBattleService.activateObservation(TOKEN, bluePlayer.getId(), request));
        assertThat(ex.getStatusCode().value()).isEqualTo(400);
    }

    @Test
    void outOfBounds_weak_400() {
        Game game = buildInProgressGame();
        UUID blueBoardId = game.getBlueBoard().getId();
        HakiBattleState state = buildState(blueBoardId, 1, 1, 0);

        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));
        when(hakiBattleStateRepository.findByBoardId(blueBoardId)).thenReturn(Optional.of(state));

        // row=9, col=9 → needs 2×2 area (9,9)-(10,10) → out of bounds
        ObservationRequest request = new ObservationRequest(9, 9, null, null);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> hakiBattleService.activateObservation(TOKEN, bluePlayer.getId(), request));
        assertThat(ex.getStatusCode().value()).isEqualTo(400);
    }

    @Test
    void outOfBounds_strong_400() {
        Game game = buildInProgressGame();
        UUID blueBoardId = game.getBlueBoard().getId();
        HakiBattleState state = buildState(blueBoardId, 2, 1, 1);

        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));
        when(hakiBattleStateRepository.findByBoardId(blueBoardId)).thenReturn(Optional.of(state));

        // row=8, col=8 → needs 3×3 area (8,8)-(10,10) → out of bounds
        ObservationRequest request = new ObservationRequest(8, 8, null, null);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> hakiBattleService.activateObservation(TOKEN, bluePlayer.getId(), request));
        assertThat(ex.getStatusCode().value()).isEqualTo(400);
    }

    @Test
    void revealCorrectlyIdentifiesShipCells() {
        Game game = buildInProgressGame();
        // Red board has STRIKER at (0,0) HORIZONTAL → occupies (0,0) and (0,1)
        UUID blueBoardId = game.getBlueBoard().getId();
        HakiBattleState state = buildState(blueBoardId, 1, 1, 0);

        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));
        when(hakiBattleStateRepository.findByBoardId(blueBoardId)).thenReturn(Optional.of(state));
        when(hakiBattleStateRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        // Observe 2×2 at (0,0) → cells (0,0), (0,1), (1,0), (1,1)
        ObservationRequest request = new ObservationRequest(0, 0, null, null);
        ObservationResponse response = hakiBattleService.activateObservation(TOKEN, bluePlayer.getId(), request);

        RevealedCell cell00 = response.revealedCells().stream().filter(c -> c.row() == 0 && c.col() == 0).findFirst().orElseThrow();
        RevealedCell cell01 = response.revealedCells().stream().filter(c -> c.row() == 0 && c.col() == 1).findFirst().orElseThrow();
        RevealedCell cell10 = response.revealedCells().stream().filter(c -> c.row() == 1 && c.col() == 0).findFirst().orElseThrow();
        RevealedCell cell11 = response.revealedCells().stream().filter(c -> c.row() == 1 && c.col() == 1).findFirst().orElseThrow();

        assertThat(cell00.status()).isEqualTo(CellRevealStatus.HAS_SHIP);
        assertThat(cell01.status()).isEqualTo(CellRevealStatus.HAS_SHIP);
        assertThat(cell10.status()).isEqualTo(CellRevealStatus.EMPTY);
        assertThat(cell11.status()).isEqualTo(CellRevealStatus.EMPTY);
    }

    @Test
    void sseEmittedToOpponent() {
        Game game = buildInProgressGame();
        UUID blueBoardId = game.getBlueBoard().getId();
        HakiBattleState state = buildState(blueBoardId, 1, 1, 0);

        when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));
        when(hakiBattleStateRepository.findByBoardId(blueBoardId)).thenReturn(Optional.of(state));
        when(hakiBattleStateRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        ObservationRequest request = new ObservationRequest(0, 0, null, null);
        hakiBattleService.activateObservation(TOKEN, bluePlayer.getId(), request);

        verify(gameEventEmitter).emitObservationHakiUsed(TOKEN, redPlayer.getId());
    }

    // --- resetHakiUsedThisTurn tests ---

    @Test
    void resetHakiUsedThisTurn_clearsFlag() {
        UUID boardId = UUID.randomUUID();
        HakiBattleState state = buildState(boardId, 2, 1, 1);
        state.setHakiUsedThisTurn(true);

        when(hakiBattleStateRepository.findByBoardId(boardId)).thenReturn(Optional.of(state));
        when(hakiBattleStateRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        hakiBattleService.resetHakiUsedThisTurn(boardId);

        assertThat(state.isHakiUsedThisTurn()).isFalse();
        verify(hakiBattleStateRepository).save(state);
    }
}
