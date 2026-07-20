package com.last_island.api.domain.board.service;

import com.last_island.api.domain.board.dto.BoardResponse;
import com.last_island.api.domain.board.dto.PlaceShipsRequest;
import com.last_island.api.domain.board.dto.ShipPlacementDto;
import com.last_island.api.domain.board.dto.ShotRequest;
import com.last_island.api.domain.board.dto.ShotResponse;
import com.last_island.api.domain.board.entity.Board;
import com.last_island.api.domain.board.entity.Ship;
import com.last_island.api.domain.board.entity.Shot;
import com.last_island.api.domain.board.enums.Orientation;
import com.last_island.api.domain.board.enums.ShipType;
import com.last_island.api.domain.board.enums.ShotResult;
import com.last_island.api.domain.board.mapper.BoardMapper;
import com.last_island.api.domain.game.entity.Game;
import com.last_island.api.domain.game.entity.GameResult;
import com.last_island.api.domain.game.enums.GamePhase;
import com.last_island.api.domain.game.repository.GameRepository;
import com.last_island.api.domain.game.repository.GameResultRepository;
import com.last_island.api.domain.user.entity.User;
import com.last_island.api.domain.user.service.BountyService;
import com.last_island.api.domain.haki.dto.ArmamentTriggerResult;
import com.last_island.api.domain.haki.service.HakiBattleService;
import com.last_island.api.infrastructure.sse.GameEventEmitter;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BoardService {

    private final GameRepository gameRepository;
    private final GameResultRepository gameResultRepository;
    private final GameEventEmitter gameEventEmitter;
    private final BountyService bountyService;
    private final HakiBattleService hakiBattleService;

    public BoardService(GameRepository gameRepository, GameResultRepository gameResultRepository, GameEventEmitter gameEventEmitter, BountyService bountyService, HakiBattleService hakiBattleService) {
        this.gameRepository = gameRepository;
        this.gameResultRepository = gameResultRepository;
        this.gameEventEmitter = gameEventEmitter;
        this.bountyService = bountyService;
        this.hakiBattleService = hakiBattleService;
    }

    @Transactional
    public BoardResponse placeShips(String token, UUID userId, PlaceShipsRequest request) {
        // 1. Fetch game
        Game game = gameRepository.findByTokenAndIsActiveTrue(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Battle not found"));

        // 2. Validate phase
        if (game.getPhase() != GamePhase.PLACING_SHIPS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This battle is not in the fleet deployment phase");
        }

        // 3. Identify player's board
        Board board;
        Board opponentBoard;
        if (game.getBlueBoard().getOwner().getId().equals(userId)) {
            board = game.getBlueBoard();
            opponentBoard = game.getRedBoard();
        } else if (game.getRedBoard().getOwner().getId().equals(userId)) {
            board = game.getRedBoard();
            opponentBoard = game.getBlueBoard();
        } else {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not a participant in this battle");
        }

        // 4. Clear existing ships if redeploying
        if (!board.getShips().isEmpty()) {
            board.getShips().clear();
        }

        // 5. Validate exactly 5 ships
        if (request.ships().size() != 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A fleet requires exactly 5 vessels");
        }

        // 6. Validate fleet matches pirate fleet
        Set<ShipType> requiredTypes = Set.of(
                ShipType.THOUSAND_SUNNY, ShipType.MOBY_DICK, ShipType.RED_FORCE,
                ShipType.POLAR_TANG, ShipType.STRIKER);

        Set<ShipType> submittedTypes = request.ships().stream()
                .map(ShipPlacementDto::type)
                .collect(Collectors.toSet());

        if (!submittedTypes.equals(requiredTypes) || request.ships().size() != submittedTypes.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vessels must match the pirate fleet (no duplicates)");
        }

        // 7. Validate bounds
        for (ShipPlacementDto placement : request.ships()) {
            int row = placement.row();
            int col = placement.col();
            int size = placement.type().getSize();

            if (row < 0 || row > 9 || col < 0 || col > 9) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vessel position is off the sea chart");
            }

            if (placement.orientation() == Orientation.HORIZONTAL && col + size - 1 > 9) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vessel extends beyond the sea chart horizontally");
            }

            if (placement.orientation() == Orientation.VERTICAL && row + size - 1 > 9) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vessel extends beyond the sea chart vertically");
            }
        }

        // 8. Validate no overlaps
        Set<Integer> occupiedCells = new HashSet<>();
        for (ShipPlacementDto placement : request.ships()) {
            int size = placement.type().getSize();
            for (int i = 0; i < size; i++) {
                int cellRow = placement.row() + (placement.orientation() == Orientation.VERTICAL ? i : 0);
                int cellCol = placement.col() + (placement.orientation() == Orientation.HORIZONTAL ? i : 0);
                int cellKey = cellRow * 10 + cellCol;

                if (!occupiedCells.add(cellKey)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vessels cannot overlap");
                }
            }
        }

        // 9. Build Ship entities
        for (ShipPlacementDto placement : request.ships()) {
            Ship ship = Ship.builder()
                    .board(board)
                    .type(placement.type())
                    .orientation(placement.orientation())
                    .row(placement.row())
                    .col(placement.col())
                    .hits(0)
                    .build();
            board.getShips().add(ship);
        }

        // 10. Initialize HakiBattleState for this board (early, per-board)
        hakiBattleService.initializeForBoard(board);

        // 11. Check if both players have placed → transition to IN_PROGRESS
        if (opponentBoard != null && !opponentBoard.getShips().isEmpty()) {
            game.setPhase(GamePhase.IN_PROGRESS);
            game.setStartedAt(LocalDateTime.now());
            game.setTurnStartedAt(LocalDateTime.now());
        }

        // 12. Save game (cascades board + ships)
        gameRepository.save(game);

        // 13. Emit SSE events after commit
        boolean gameStarted = game.getPhase() == GamePhase.IN_PROGRESS;
        UUID opponentUserId = opponentBoard.getOwner().getId();
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    if (gameStarted) {
                        gameEventEmitter.emitGameStarted(token);
                    } else {
                        gameEventEmitter.emitShipsPlaced(token, opponentUserId);
                    }
                }
            });
        }

        // 14. Return response
        return BoardMapper.toResponse(board, game.getPhase().name());
    }

    @Transactional
    public ShotResponse fireShot(String token, UUID userId, ShotRequest request) {
        // 1. Validate coordinates
        if (request.row() < 0 || request.row() > 9 || request.col() < 0 || request.col() > 9) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Coordinates are off the sea chart");
        }

        // 2. Fetch game
        Game game = gameRepository.findByTokenAndIsActiveTrue(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Battle not found"));

        // 3. Validate phase
        if (game.getPhase() != GamePhase.IN_PROGRESS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This battle has not started yet");
        }

        // 4. Identify player's board and opponent's board
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

        // 5. Validate turn
        if (!game.getCurrentTurn().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "It's not your turn to fire, wait for your opponent");
        }

        // 5b. Race condition guard — reject shots after turn expired
        if (game.getTurnStartedAt() != null && game.getTurnStartedAt().plusSeconds(120).isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Your turn has expired, Captain!");
        }

        // 6. Check duplicate shot on opponent's board
        boolean alreadyFired = opponentBoard.getShots().stream()
                .anyMatch(s -> s.getRow() == request.row() && s.getCol() == request.col());
        if (alreadyFired) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already fired on these coordinates");
        }

        // 7. Resolve shot
        ShotResult result = ShotResult.MISS;
        Ship hitShip = null;

        for (Ship ship : opponentBoard.getShips()) {
            int shipSize = ship.getType().getSize();
            for (int i = 0; i < shipSize; i++) {
                int cellRow = ship.getRow() + (ship.getOrientation() == Orientation.VERTICAL ? i : 0);
                int cellCol = ship.getCol() + (ship.getOrientation() == Orientation.HORIZONTAL ? i : 0);

                if (cellRow == request.row() && cellCol == request.col()) {
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

        // 8. Create and store shot on opponent's board
        Shot shot = Shot.builder()
                .board(opponentBoard)
                .attacker(playerBoard.getOwner())
                .row(request.row())
                .col(request.col())
                .result(result)
                .build();
        opponentBoard.getShots().add(shot);

        // 8b. Check Armament trigger
        ArmamentTriggerResult armamentResult = null;
        if (hitShip != null && (result == ShotResult.HIT || result == ShotResult.SUNK)) {
            armamentResult = hakiBattleService.checkArmamentTrigger(
                    opponentBoard, hitShip, request.row(), request.col(), playerBoard);
        }

        // 9. Update attacker stats
        User attacker = playerBoard.getOwner();
        attacker.setTotalShots(attacker.getTotalShots() + 1);
        if (result == ShotResult.HIT || result == ShotResult.SUNK) {
            attacker.setTotalHits(attacker.getTotalHits() + 1);
        }

        // 10. Check win condition
        String sunkShipType = (result == ShotResult.SUNK && hitShip != null) ? hitShip.getType().name() : null;

        if (result == ShotResult.SUNK && opponentBoard.getShips().stream().allMatch(Ship::isSunk)) {
            // All enemy vessels have been sunk — victory!
            game.setPhase(GamePhase.FINISHED);
            game.setEndedAt(LocalDateTime.now());

            int totalTurns = game.getBlueBoard().getShots().size() + game.getRedBoard().getShots().size();

            User loser = opponentBoard.getOwner();
            GameResult gameResult = GameResult.builder()
                    .game(game)
                    .winner(attacker)
                    .loser(loser)
                    .turns(totalTurns)
                    .build();
            gameResultRepository.save(gameResult);

            attacker.setWins(attacker.getWins() + 1);
            loser.setLosses(loser.getLosses() + 1);

            long bountyDelta = bountyService.updateBounties(attacker, loser);
            game.setBountyDelta(bountyDelta);

            // Do NOT switch turn — game is over
            gameRepository.save(game);

            String winnerName = attacker.getName();
            if (TransactionSynchronizationManager.isSynchronizationActive()) {
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        gameEventEmitter.emitGameOver(token, winnerName);
                    }
                });
            }

            return new ShotResponse(result, sunkShipType, request.row(), request.col(), true, attacker.getName());
        }

        // 11. Switch turn only on MISS (player keeps firing on HIT/SUNK)
        boolean turnSwitched = false;
        boolean turnSkippedByArmament = false;
        if (result == ShotResult.MISS) {
            game.setCurrentTurn(opponentBoard.getOwner());
            game.setTurnStartedAt(LocalDateTime.now());
            turnSwitched = true;
            hakiBattleService.resetHakiUsedThisTurn(opponentBoard.getId());

            // 11b. Check if the player who just missed (attacker) owes skip turns.
            // opponentSkipTurns on the DEFENDER's (opponentBoard) state means
            // "the attacker of this board owes N skipped turns."
            // But here the attacker already MISSED and turn went to defender.
            // The skip is consumed when the attacker's turn would START again.
            // So we DON'T consume here — the skip will be consumed when the NEW current
            // player (defender/opponent) fires and misses, switching turn back to attacker.
            // At THAT point, the code below handles it.

            // However, we must also check: is the RECEIVER (opponentBoard.owner = defender)
            // owed any skips from the OTHER direction? I.e., does playerBoard.state have
            // opponentSkipTurns > 0 meaning "the opponent of playerBoard (= defender) owes skips"?
            // If so, defender's turn is skipped and turn goes back to attacker.
            if (hakiBattleService.consumeSkipTurn(playerBoard)) {
                // The defender (who just received the turn) owes a skip.
                // Switch turn BACK to attacker.
                game.setCurrentTurn(playerBoard.getOwner());
                game.setTurnStartedAt(LocalDateTime.now());
                turnSkippedByArmament = true;
                hakiBattleService.resetHakiUsedThisTurn(playerBoard.getId());
            }
        } else {
            // HIT or SUNK — same player continues, reset turn timer
            game.setTurnStartedAt(LocalDateTime.now());
        }

        // 12. Save game (cascades)
        gameRepository.save(game);

        // 13. Emit SHOT_RECEIVED to opponent after commit
        UUID targetPlayerId = opponentBoard.getOwner().getId();
        int shotRow = request.row();
        int shotCol = request.col();
        String shotResult = result.name();
        String sunkType = sunkShipType;
        boolean isOpponentTurn = turnSwitched;
        final ArmamentTriggerResult finalArmamentResult = armamentResult;
        final boolean finalTurnSkippedByArmament = turnSkippedByArmament;
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    gameEventEmitter.emitShotReceived(token, targetPlayerId, shotRow, shotCol, shotResult, sunkType, isOpponentTurn);
                    if (finalArmamentResult != null) {
                        gameEventEmitter.emitArmamentHakiTriggered(token, userId, finalArmamentResult.turnSkipped(),
                                finalArmamentResult.counterFire());
                    }
                    if (finalTurnSkippedByArmament) {
                        gameEventEmitter.emitArmamentHakiTriggered(token, targetPlayerId, true, null);
                    }
                }
            });
        }

        // 14. Return response
        boolean armamentTriggered = armamentResult != null;
        return new ShotResponse(result, sunkShipType, request.row(), request.col(), false, null,
                armamentTriggered, armamentResult != null ? armamentResult.counterFire() : null,
                game.getCurrentTurn().getName());
    }
}
