package com.last_island.api.domain.haki.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.last_island.api.domain.board.entity.Board;
import com.last_island.api.domain.board.entity.Ship;
import com.last_island.api.domain.board.entity.Shot;
import com.last_island.api.domain.board.enums.Orientation;
import com.last_island.api.domain.board.enums.ShotResult;
import com.last_island.api.domain.game.entity.Game;
import com.last_island.api.domain.game.enums.GamePhase;
import com.last_island.api.domain.game.repository.GameRepository;
import com.last_island.api.domain.haki.dto.*;
import com.last_island.api.domain.haki.entity.HakiBattleState;
import com.last_island.api.domain.haki.entity.HakiProfile;
import com.last_island.api.domain.haki.enums.CellRevealStatus;
import com.last_island.api.domain.haki.repository.HakiBattleStateRepository;
import com.last_island.api.domain.haki.repository.HakiProfileRepository;
import com.last_island.api.infrastructure.metrics.GameMetrics;
import com.last_island.api.infrastructure.sse.GameEventEmitter;
import io.opentelemetry.api.GlobalOpenTelemetry;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.StatusCode;
import io.opentelemetry.api.trace.Tracer;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@Service
public class HakiBattleService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final HakiBattleStateRepository hakiBattleStateRepository;
    private final HakiProfileRepository hakiProfileRepository;
    private final GameRepository gameRepository;
    private final GameEventEmitter gameEventEmitter;
    private final GameMetrics gameMetrics;
    private final Tracer tracer;

    public HakiBattleService(HakiBattleStateRepository hakiBattleStateRepository,
                             HakiProfileRepository hakiProfileRepository,
                             GameRepository gameRepository,
                             GameEventEmitter gameEventEmitter,
                             GameMetrics gameMetrics) {
        this.hakiBattleStateRepository = hakiBattleStateRepository;
        this.hakiProfileRepository = hakiProfileRepository;
        this.gameRepository = gameRepository;
        this.gameEventEmitter = gameEventEmitter;
        this.gameMetrics = gameMetrics;
        this.tracer = GlobalOpenTelemetry.get().getTracer("last-island");
    }

    @Transactional
    public void initializeHakiBattleStates(Game game) {
        initializeForBoard(game.getBlueBoard());
        initializeForBoard(game.getRedBoard());
    }

    @Transactional
    public void initializeForBoard(Board board) {
        // If state already exists (e.g., from early initialization), skip
        if (hakiBattleStateRepository.findByBoardId(board.getId()).isPresent()) {
            return;
        }

        UUID ownerId = board.getOwner().getId();
        HakiProfile profile = hakiProfileRepository.findByUserId(ownerId)
                .orElse(null);

        int observationLevel = (profile != null) ? profile.getObservationLevel() : 0;
        int usesRemaining = computeUsesRemaining(observationLevel);
        int armamentLevel = (profile != null) ? profile.getArmamentLevel() : 0;
        int conquerorsLevel = (profile != null) ? profile.getConquerorsLevel() : 0;
        int conquerorsUsesRemaining = computeConquerorsUses(conquerorsLevel);

        HakiBattleState state = HakiBattleState.builder()
                .boardId(board.getId())
                .observationUsesRemaining(usesRemaining)
                .observationUsesConsumed(0)
                .observationLevel(observationLevel)
                .conquerorsLevel(conquerorsLevel)
                .conquerorsUsesRemaining(conquerorsUsesRemaining)
                .conquerorsUsesConsumed(0)
                .conquerorsCooldownTurns(0)
                .hakiUsedThisTurn(false)
                .armamentLevel(armamentLevel)
                .armamentShip1Id(null)
                .armamentShip2Id(null)
                .armamentShip1HitsAbsorbed(0)
                .armamentShip2HitsAbsorbed(0)
                .opponentSkipTurns(0)
                .build();

        hakiBattleStateRepository.save(state);
    }

    private int computeUsesRemaining(int observationLevel) {
        return switch (observationLevel) {
            case 1 -> 1;
            case 2, 3 -> 2;
            default -> 0;
        };
    }

    private int computeConquerorsUses(int conquerorsLevel) {
        return switch (conquerorsLevel) {
            case 1 -> 1;
            case 2, 3 -> 2;
            default -> 0;
        };
    }

    // --- Armament Haki: Assignment ---

    @Transactional
    public void assignArmament(String token, UUID userId, ArmamentAssignmentRequest request) {
        Span span = tracer.spanBuilder("HakiBattleService.assignArmament")
                .setAttribute("game.token", token)
                .setAttribute("player.id", userId.toString())
                .startSpan();
        try {
        // Fetch game
        Game game = gameRepository.findByTokenAndIsActiveTrue(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Battle not found"));

        // Validate phase
        if (game.getPhase() != GamePhase.PLACING_SHIPS && game.getPhase() != GamePhase.IN_PROGRESS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Armament can only be assigned during fleet deployment or early battle");
        }

        // Identify player's board
        Board board;
        if (game.getBlueBoard().getOwner().getId().equals(userId)) {
            board = game.getBlueBoard();
        } else if (game.getRedBoard().getOwner().getId().equals(userId)) {
            board = game.getRedBoard();
        } else {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not a participant in this battle");
        }

        // Validate ships placed
        if (board.getShips().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You must place your fleet before assigning Armament Haki");
        }

        // Fetch HakiBattleState
        HakiBattleState state = hakiBattleStateRepository.findByBoardId(board.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Haki battle state not found"));

        // Validate armament level
        if (state.getArmamentLevel() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Armament Haki not unlocked");
        }

        // Validate ship1Id belongs to board
        if (request.ship1Id() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ship1Id is required");
        }
        boolean ship1OnBoard = board.getShips().stream()
                .anyMatch(s -> s.getId().equals(request.ship1Id()));
        if (!ship1OnBoard) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ship1Id does not belong to your board");
        }

        // Lv1: ship2Id must be null
        if (state.getArmamentLevel() == 1) {
            if (request.ship2Id() != null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Level 1 Armament only supports one ship");
            }
        }

        // Lv2+: ship2Id validation
        if (state.getArmamentLevel() >= 2) {
            if (request.ship2Id() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Level 2+ Armament requires two ships");
            }
            if (request.ship2Id().equals(request.ship1Id())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ship1Id and ship2Id must be different ships");
            }
            boolean ship2OnBoard = board.getShips().stream()
                    .anyMatch(s -> s.getId().equals(request.ship2Id()));
            if (!ship2OnBoard) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ship2Id does not belong to your board");
            }
        }

        // Set armament ship IDs
        state.setArmamentShip1Id(request.ship1Id());
        state.setArmamentShip2Id(state.getArmamentLevel() >= 2 ? request.ship2Id() : null);
        // Reset absorbed hits in case of reassignment
        state.setArmamentShip1HitsAbsorbed(0);
        state.setArmamentShip2HitsAbsorbed(0);

        hakiBattleStateRepository.save(state);
        gameMetrics.incrementHakiUsage("armament");
        } catch (Exception e) {
            span.setStatus(StatusCode.ERROR, e.getMessage());
            span.recordException(e);
            throw e;
        } finally {
            span.end();
        }
    }

    // --- Armament Haki: Trigger Check ---

    @Transactional
    public ArmamentTriggerResult checkArmamentTrigger(Board defenderBoard, Ship hitShip, int hitRow, int hitCol, Board attackerBoard) {
        HakiBattleState state = hakiBattleStateRepository.findByBoardId(defenderBoard.getId())
                .orElse(null);

        if (state == null || state.getArmamentLevel() <= 0) {
            return null;
        }

        UUID hitShipId = hitShip.getId();

        // Check ship1 (weak buff)
        if (hitShipId.equals(state.getArmamentShip1Id())) {
            if (state.getArmamentShip1HitsAbsorbed() < 3) {
                state.setArmamentShip1HitsAbsorbed(state.getArmamentShip1HitsAbsorbed() + 1);
                hakiBattleStateRepository.save(state);
                return new ArmamentTriggerResult(null);
            }
            return null;
        }

        // Check ship2 (strong/awakened buff) — only for Lv2+
        if (state.getArmamentLevel() >= 2 && hitShipId.equals(state.getArmamentShip2Id())) {
            state.setArmamentShip2HitsAbsorbed(state.getArmamentShip2HitsAbsorbed() + 1);

            CounterFireResult counterFire = null;
            if (state.getArmamentLevel() == 3) {
                counterFire = resolveCounterFire(attackerBoard, hitRow, hitCol, defenderBoard.getOwner());
            }

            hakiBattleStateRepository.save(state);
            return new ArmamentTriggerResult(counterFire);
        }

        return null;
    }

    // --- Armament Haki: Counter-fire ---

    CounterFireResult resolveCounterFire(Board attackerBoard, int targetRow, int targetCol, com.last_island.api.domain.user.entity.User defender) {
        int[] targetCell = findCounterFireCell(attackerBoard, targetRow, targetCol);
        int fireRow = targetCell[0];
        int fireCol = targetCell[1];

        // Resolve the shot on attacker's board
        ShotResult result = ShotResult.MISS;
        Ship hitShip = null;

        for (Ship ship : attackerBoard.getShips()) {
            int shipSize = ship.getType().getSize();
            for (int i = 0; i < shipSize; i++) {
                int cellRow = ship.getRow() + (ship.getOrientation() == Orientation.VERTICAL ? i : 0);
                int cellCol = ship.getCol() + (ship.getOrientation() == Orientation.HORIZONTAL ? i : 0);

                if (cellRow == fireRow && cellCol == fireCol) {
                    ship.setHits(ship.getHits() + 1);
                    hitShip = ship;
                    result = ship.isSunk() ? ShotResult.SUNK : ShotResult.HIT;
                    break;
                }
            }
            if (hitShip != null) {
                break;
            }
        }

        // Create shot on attacker's board (fired by defender)
        Shot counterShot = Shot.builder()
                .board(attackerBoard)
                .attacker(defender)
                .row(fireRow)
                .col(fireCol)
                .result(result)
                .build();
        attackerBoard.getShots().add(counterShot);

        String sunkShipType = (result == ShotResult.SUNK && hitShip != null) ? hitShip.getType().name() : null;
        return new CounterFireResult(result, fireRow, fireCol, sunkShipType);
    }

    private int[] findCounterFireCell(Board attackerBoard, int targetRow, int targetCol) {
        // Check if target cell is already hit
        if (!isCellAlreadyHit(attackerBoard, targetRow, targetCol)) {
            return new int[]{targetRow, targetCol};
        }

        // Try adjacent cells (distance 1: orthogonal + diagonal)
        int[] found = findAvailableCellAtDistance(attackerBoard, targetRow, targetCol, 1);
        if (found != null) {
            return found;
        }

        // Try distance 2
        found = findAvailableCellAtDistance(attackerBoard, targetRow, targetCol, 2);
        if (found != null) {
            return found;
        }

        // Expand further if needed (should not happen in practice on a 10x10 board)
        for (int distance = 3; distance <= 9; distance++) {
            found = findAvailableCellAtDistance(attackerBoard, targetRow, targetCol, distance);
            if (found != null) {
                return found;
            }
        }

        // Fallback: should never reach here on a 10x10 board
        return new int[]{targetRow, targetCol};
    }

    private int[] findAvailableCellAtDistance(Board board, int centerRow, int centerCol, int distance) {
        for (int dr = -distance; dr <= distance; dr++) {
            for (int dc = -distance; dc <= distance; dc++) {
                if (Math.abs(dr) != distance && Math.abs(dc) != distance) {
                    continue; // Only check cells at exactly this distance (Chebyshev)
                }
                int r = centerRow + dr;
                int c = centerCol + dc;
                if (r >= 0 && r <= 9 && c >= 0 && c <= 9 && !isCellAlreadyHit(board, r, c)) {
                    return new int[]{r, c};
                }
            }
        }
        return null;
    }

    private boolean isCellAlreadyHit(Board board, int row, int col) {
        return board.getShots().stream()
                .anyMatch(s -> s.getRow() == row && s.getCol() == col);
    }

    // --- Armament Haki: Turn Skip ---

    /**
     * Checks if the player about to receive the turn owes skip turns.
     * Called after a turn switch. Returns true if the turn was skipped.
     */
    @Transactional
    public boolean consumeSkipTurn(Board defenderBoard) {
        HakiBattleState state = hakiBattleStateRepository.findByBoardId(defenderBoard.getId())
                .orElse(null);

        if (state != null && state.getOpponentSkipTurns() > 0) {
            state.setOpponentSkipTurns(state.getOpponentSkipTurns() - 1);

            // If skip window just ended, set Conqueror's cooldown
            if (state.getOpponentSkipTurns() == 0 && state.getConquerorsLevel() > 0 && state.getConquerorsUsesConsumed() > 0) {
                int cooldown = (state.getConquerorsUsesConsumed() == 1) ? 1 : 2;
                state.setConquerorsCooldownTurns(cooldown);
            }

            hakiBattleStateRepository.save(state);
            return true;
        }
        return false;
    }

    // --- Conqueror's Haki: Activation ---

    @Transactional
    public ConquerorsActivationResponse activateConquerors(String token, UUID userId, ConquerorsActivationRequest request) {
        Span span = tracer.spanBuilder("HakiBattleService.activateConquerors")
                .setAttribute("game.token", token)
                .setAttribute("player.id", userId.toString())
                .startSpan();
        try {
        // Fetch game
        Game game = gameRepository.findByTokenAndIsActiveTrue(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Battle not found"));

        // Validate phase
        if (game.getPhase() != GamePhase.IN_PROGRESS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This battle is not in progress");
        }

        // Identify player/opponent boards
        Board playerBoard;
        Board opponentBoard;
        if (game.getBlueBoard().getOwner().getId().equals(userId)) {
            playerBoard = game.getBlueBoard();
            opponentBoard = game.getRedBoard();
        } else if (game.getRedBoard().getOwner().getId().equals(userId)) {
            playerBoard = game.getRedBoard();
            opponentBoard = game.getBlueBoard();
        } else {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not a participant in this battle");
        }

        // Validate turn
        if (!game.getCurrentTurn().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "It's not your turn, wait for your opponent");
        }

        // Fetch player's HakiBattleState
        HakiBattleState state = hakiBattleStateRepository.findByBoardId(playerBoard.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Haki battle state not found"));

        // Validate haki not already used this turn
        if (state.isHakiUsedThisTurn()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You already used Haki this turn");
        }

        // Validate conquerors unlocked
        if (state.getConquerorsLevel() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Conqueror's Haki not unlocked");
        }

        // Validate uses remaining
        if (state.getConquerorsUsesRemaining() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No Conqueror's uses remaining");
        }

        // Validate cooldown
        if (state.getConquerorsCooldownTurns() > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Conqueror's Haki is on cooldown");
        }

        // Determine effect level based on conqueror's level (first use = full power, second use = WEAK)
        String effectLevel;
        if (state.getConquerorsUsesConsumed() > 0) {
            effectLevel = "WEAK";
        } else if (state.getConquerorsLevel() >= 3) {
            effectLevel = "AWAKENED";
        } else if (state.getConquerorsLevel() == 2) {
            effectLevel = "STRONG";
        } else {
            effectLevel = "WEAK";
        }

        // Compute skip turns
        int skipTurns = "WEAK".equals(effectLevel) ? 3 : 5;

        // Add skip turns to playerBoard's opponentSkipTurns BEFORE X-pattern resolution
        HakiBattleState playerState = hakiBattleStateRepository.findByBoardId(playerBoard.getId())
                .orElse(state);
        playerState.setOpponentSkipTurns(playerState.getOpponentSkipTurns() + skipTurns);

        // For AWAKENED: validate row/col and resolve X-pattern
        List<XPatternShotResult> xPatternShots = null;
        if ("AWAKENED".equals(effectLevel)) {
            if (request.row() == null || request.col() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Awakened Conqueror's requires row and col for X-pattern");
            }
            if (request.row() < 0 || request.row() > 9 || request.col() < 0 || request.col() > 9) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "X-pattern center must be within the sea chart");
            }
            xPatternShots = resolveXPattern(opponentBoard, request.row(), request.col(), playerBoard, game, token);
        }

        // Update state
        state.setConquerorsUsesRemaining(state.getConquerorsUsesRemaining() - 1);
        state.setConquerorsUsesConsumed(state.getConquerorsUsesConsumed() + 1);
        state.setHakiUsedThisTurn(true);
        hakiBattleStateRepository.save(state);

        // Emit SSE to opponent
        UUID opponentId = opponentBoard.getOwner().getId();
        gameEventEmitter.emitConquerorsHakiUsed(token, opponentId, skipTurns, effectLevel);

        gameMetrics.incrementHakiUsage("conquerors");
        return new ConquerorsActivationResponse(skipTurns, effectLevel, xPatternShots);
        } catch (Exception e) {
            span.setStatus(StatusCode.ERROR, e.getMessage());
            span.recordException(e);
            throw e;
        } finally {
            span.end();
        }
    }

    // --- Conqueror's Haki: X-pattern resolution ---

    private List<XPatternShotResult> resolveXPattern(Board opponentBoard, int centerRow, int centerCol, Board playerBoard, Game game, String token) {
        // Center + 4 diagonal cells
        int[][] cells = {
                {centerRow, centerCol},
                {centerRow - 1, centerCol - 1},
                {centerRow - 1, centerCol + 1},
                {centerRow + 1, centerCol - 1},
                {centerRow + 1, centerCol + 1}
        };

        List<XPatternShotResult> results = new ArrayList<>();

        for (int[] cell : cells) {
            int row = cell[0];
            int col = cell[1];

            // Skip out-of-bounds
            if (row < 0 || row > 9 || col < 0 || col > 9) {
                continue;
            }

            // Skip already-hit cells
            if (isCellAlreadyHit(opponentBoard, row, col)) {
                continue;
            }

            // Resolve shot
            ShotResult result = ShotResult.MISS;
            Ship hitShip = null;

            for (Ship ship : opponentBoard.getShips()) {
                int shipSize = ship.getType().getSize();
                for (int i = 0; i < shipSize; i++) {
                    int cellRow = ship.getRow() + (ship.getOrientation() == Orientation.VERTICAL ? i : 0);
                    int cellCol = ship.getCol() + (ship.getOrientation() == Orientation.HORIZONTAL ? i : 0);

                    if (cellRow == row && cellCol == col) {
                        ship.setHits(ship.getHits() + 1);
                        hitShip = ship;
                        result = ship.isSunk() ? ShotResult.SUNK : ShotResult.HIT;
                        break;
                    }
                }
                if (hitShip != null) {
                    break;
                }
            }

            // Create shot entity
            Shot xShot = Shot.builder()
                    .board(opponentBoard)
                    .attacker(playerBoard.getOwner())
                    .row(row)
                    .col(col)
                    .result(result)
                    .build();
            opponentBoard.getShots().add(xShot);

            // Check Armament trigger (eats skip turn if Conqueror's window active)
            if (hitShip != null && (result == ShotResult.HIT || result == ShotResult.SUNK)) {
                checkArmamentTrigger(opponentBoard, hitShip, row, col, playerBoard);
            }

            String sunkShipType = (result == ShotResult.SUNK && hitShip != null) ? hitShip.getType().name() : null;
            results.add(new XPatternShotResult(row, col, result, sunkShipType));
        }

        // Check win condition after X-pattern resolves
        if (opponentBoard.getShips().stream().allMatch(Ship::isSunk)) {
            game.setPhase(GamePhase.FINISHED);
            game.setEndedAt(java.time.LocalDateTime.now());

            int totalTurns = game.getBlueBoard().getShots().size() + game.getRedBoard().getShots().size();

            com.last_island.api.domain.user.entity.User attacker = playerBoard.getOwner();
            com.last_island.api.domain.user.entity.User loser = opponentBoard.getOwner();

            attacker.setWins(attacker.getWins() + 1);
            loser.setLosses(loser.getLosses() + 1);

            gameEventEmitter.emitGameOver(token, attacker.getName());
        }

        return results;
    }

    // --- Observation Haki ---

    @Transactional
    public ObservationResponse activateObservation(String token, UUID userId, ObservationRequest request) {
        Span span = tracer.spanBuilder("HakiBattleService.activateObservation")
                .setAttribute("game.token", token)
                .setAttribute("player.id", userId.toString())
                .startSpan();
        try {
        // Fetch game
        Game game = gameRepository.findByTokenAndIsActiveTrue(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Battle not found"));

        // Validate phase
        if (game.getPhase() != GamePhase.IN_PROGRESS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This battle is not in progress");
        }

        // Identify player/opponent boards
        Board playerBoard;
        Board opponentBoard;
        if (game.getBlueBoard().getOwner().getId().equals(userId)) {
            playerBoard = game.getBlueBoard();
            opponentBoard = game.getRedBoard();
        } else if (game.getRedBoard().getOwner().getId().equals(userId)) {
            playerBoard = game.getRedBoard();
            opponentBoard = game.getBlueBoard();
        } else {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not a participant in this battle");
        }

        // Validate turn
        if (!game.getCurrentTurn().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "It's not your turn, wait for your opponent");
        }

        // Fetch player's HakiBattleState
        HakiBattleState state = hakiBattleStateRepository.findByBoardId(playerBoard.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Haki battle state not found"));

        // Validate haki not already used this turn
        if (state.isHakiUsedThisTurn()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You already used Haki this turn");
        }

        // Validate observation unlocked
        if (state.getObservationLevel() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Observation Haki not unlocked");
        }

        // Validate uses remaining
        if (state.getObservationUsesRemaining() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No Observation Haki uses remaining");
        }

        // Determine effect level
        String effectLevel = determineEffectLevel(state);

        // Validate bounds
        int row = request.row();
        int col = request.col();

        if ("WEAK".equals(effectLevel)) {
            if (row < 0 || row + 1 > 9 || col < 0 || col + 1 > 9) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Observation area extends beyond the sea chart");
            }
        } else {
            // STRONG or AWAKENED — 3×3
            if (row < 0 || row + 2 > 9 || col < 0 || col + 2 > 9) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Observation area extends beyond the sea chart");
            }
        }

        // For AWAKENED: validate row AND col reveal params (reveals full cross)
        if ("AWAKENED".equals(effectLevel)) {
            boolean hasRow = request.revealRowIndex() != null;
            boolean hasCol = request.revealColIndex() != null;
            if (!hasRow || !hasCol) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Awakened observation requires both revealRowIndex and revealColIndex");
            }
            if (request.revealRowIndex() < 0 || request.revealRowIndex() > 9) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "revealRowIndex must be between 0 and 9");
            }
            if (request.revealColIndex() < 0 || request.revealColIndex() > 9) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "revealColIndex must be between 0 and 9");
            }
        }

        // Compute occupied cells on opponent board
        Set<Integer> occupiedCells = computeOccupiedCells(opponentBoard);

        // Compute revealed cells
        Set<Integer> revealedPositions = new LinkedHashSet<>();

        int areaSize = "WEAK".equals(effectLevel) ? 2 : 3;
        for (int r = row; r < row + areaSize; r++) {
            for (int c = col; c < col + areaSize; c++) {
                revealedPositions.add(r * 10 + c);
            }
        }

        // For AWAKENED: add entire row AND entire column (cross pattern)
        if ("AWAKENED".equals(effectLevel)) {
            for (int c = 0; c <= 9; c++) {
                revealedPositions.add(request.revealRowIndex() * 10 + c);
            }
            for (int r = 0; r <= 9; r++) {
                revealedPositions.add(r * 10 + request.revealColIndex());
            }
        }

        // Build response cells
        List<RevealedCell> revealedCells = new ArrayList<>();
        for (int pos : revealedPositions) {
            int cellRow = pos / 10;
            int cellCol = pos % 10;
            CellRevealStatus status = occupiedCells.contains(pos) ? CellRevealStatus.HAS_SHIP : CellRevealStatus.EMPTY;
            revealedCells.add(new RevealedCell(cellRow, cellCol, status));
        }

        // Update state
        state.setObservationUsesRemaining(state.getObservationUsesRemaining() - 1);
        state.setObservationUsesConsumed(state.getObservationUsesConsumed() + 1);
        state.setHakiUsedThisTurn(true);

        // Persist revealed cells (accumulate across uses)
        try {
            List<RevealedCell> accumulated = state.getRevealedCells() != null
                    ? OBJECT_MAPPER.readValue(state.getRevealedCells(), new TypeReference<List<RevealedCell>>() {})
                    : new ArrayList<>();
            accumulated.addAll(revealedCells);
            state.setRevealedCells(OBJECT_MAPPER.writeValueAsString(accumulated));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to persist revealed cells");
        }

        hakiBattleStateRepository.save(state);

        // Emit SSE to opponent
        UUID opponentId = opponentBoard.getOwner().getId();
        gameEventEmitter.emitObservationHakiUsed(token, opponentId);

        gameMetrics.incrementHakiUsage("observation");
        return new ObservationResponse(revealedCells, effectLevel);
        } catch (Exception e) {
            span.setStatus(StatusCode.ERROR, e.getMessage());
            span.recordException(e);
            throw e;
        } finally {
            span.end();
        }
    }

    private String determineEffectLevel(HakiBattleState state) {
        // Second use is always WEAK (2×2)
        if (state.getObservationUsesConsumed() > 0) {
            return "WEAK";
        }
        // First use depends on level
        if (state.getObservationLevel() >= 3) {
            return "AWAKENED";
        }
        if (state.getObservationLevel() == 2) {
            return "STRONG";
        }
        return "WEAK";
    }

    private Set<Integer> computeOccupiedCells(Board board) {
        Set<Integer> occupied = new HashSet<>();
        for (Ship ship : board.getShips()) {
            int size = ship.getType().getSize();
            for (int i = 0; i < size; i++) {
                int cellRow = ship.getRow() + (ship.getOrientation() == Orientation.VERTICAL ? i : 0);
                int cellCol = ship.getCol() + (ship.getOrientation() == Orientation.HORIZONTAL ? i : 0);
                occupied.add(cellRow * 10 + cellCol);
            }
        }
        return occupied;
    }

    @Transactional
    public void resetHakiUsedThisTurn(UUID boardId) {
        hakiBattleStateRepository.findByBoardId(boardId).ifPresent(state -> {
            state.setHakiUsedThisTurn(false);
            // Decrement Conqueror's cooldown when this player starts a new normal turn
            if (state.getConquerorsCooldownTurns() > 0 && state.getOpponentSkipTurns() == 0) {
                state.setConquerorsCooldownTurns(state.getConquerorsCooldownTurns() - 1);
            }
            hakiBattleStateRepository.save(state);
        });
    }
}
