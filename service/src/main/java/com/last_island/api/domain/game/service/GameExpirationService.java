package com.last_island.api.domain.game.service;

import com.last_island.api.domain.board.entity.Board;
import com.last_island.api.domain.game.entity.Game;
import com.last_island.api.domain.game.enums.GamePhase;
import com.last_island.api.domain.game.repository.GameRepository;
import com.last_island.api.domain.user.entity.User;
import com.last_island.api.infrastructure.sse.GameEventEmitter;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class GameExpirationService {

    private static final int TURN_TIMEOUT_SECONDS = 20;
    private static final int PLACING_SHIPS_TIMEOUT_MINUTES = 5;

    private final GameRepository gameRepository;
    private final GameEventEmitter gameEventEmitter;

    public GameExpirationService(GameRepository gameRepository, GameEventEmitter gameEventEmitter) {
        this.gameRepository = gameRepository;
        this.gameEventEmitter = gameEventEmitter;
    }

    @Scheduled(fixedRate = 5000)
    @Transactional
    public void checkExpirations() {
        LocalDateTime turnDeadline = LocalDateTime.now().minusSeconds(TURN_TIMEOUT_SECONDS);
        LocalDateTime placingDeadline = LocalDateTime.now().minusMinutes(PLACING_SHIPS_TIMEOUT_MINUTES);

        // PLACING_SHIPS expiration
        List<Game> expiredPlacingGames = gameRepository.findExpiredPlacingShipsGames(placingDeadline);
        for (Game game : expiredPlacingGames) {
            handleGameExpiration(game);
        }

        // Turn expiration — skip turn instead of aborting game
        List<Game> expiredTurns = gameRepository.findGamesWithExpiredTurns(turnDeadline);
        for (Game game : expiredTurns) {
            handleTurnExpiration(game, turnDeadline);
        }
    }

    public void handleGameExpiration(Game game) {
        game.setPhase(GamePhase.CANCELLED);
        game.setEndedAt(LocalDateTime.now());
        gameRepository.save(game);

        String gameToken = game.getToken();
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    gameEventEmitter.emitGameExpired(gameToken);
                }
            });
        }
    }

    public void handleTurnExpiration(Game game, LocalDateTime turnDeadline) {
        // Race guard: re-verify turnStartedAt is still expired
        if (game.getTurnStartedAt() == null || !game.getTurnStartedAt().isBefore(turnDeadline)) {
            return;
        }

        // Skip turn: switch to the opponent
        User currentPlayer = game.getCurrentTurn();
        User nextPlayer = getOpponent(game, currentPlayer);

        game.setCurrentTurn(nextPlayer);
        game.setTurnStartedAt(LocalDateTime.now());
        gameRepository.save(game);

        String gameToken = game.getToken();
        String newTurnPlayerName = nextPlayer.getName();
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    gameEventEmitter.emitTurnExpired(gameToken, newTurnPlayerName);
                }
            });
        }
    }

    private User getOpponent(Game game, User currentPlayer) {
        Board blueBoard = game.getBlueBoard();
        Board redBoard = game.getRedBoard();

        if (blueBoard.getOwner().getId().equals(currentPlayer.getId())) {
            return redBoard.getOwner();
        }
        return blueBoard.getOwner();
    }
}
