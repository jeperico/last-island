package com.last_island.api.domain.game.service;

import com.last_island.api.domain.board.entity.Board;
import com.last_island.api.domain.game.entity.Game;
import com.last_island.api.domain.game.entity.GameResult;
import com.last_island.api.domain.game.enums.GamePhase;
import com.last_island.api.domain.game.repository.GameRepository;
import com.last_island.api.domain.game.repository.GameResultRepository;
import com.last_island.api.domain.user.entity.User;
import com.last_island.api.domain.user.service.BountyService;
import com.last_island.api.infrastructure.sse.GameEventEmitter;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class GameExpirationService {

    private static final int TURN_TIMEOUT_SECONDS = 120;
    private static final int GAME_TIMEOUT_MINUTES = 30;

    private final GameRepository gameRepository;
    private final GameResultRepository gameResultRepository;
    private final GameEventEmitter gameEventEmitter;
    private final BountyService bountyService;

    public GameExpirationService(GameRepository gameRepository, GameResultRepository gameResultRepository, GameEventEmitter gameEventEmitter, BountyService bountyService) {
        this.gameRepository = gameRepository;
        this.gameResultRepository = gameResultRepository;
        this.gameEventEmitter = gameEventEmitter;
        this.bountyService = bountyService;
    }

    @Scheduled(fixedRate = 5000)
    @Transactional
    public void checkExpirations() {
        LocalDateTime turnDeadline = LocalDateTime.now().minusSeconds(TURN_TIMEOUT_SECONDS);
        LocalDateTime gameDeadline = LocalDateTime.now().minusMinutes(GAME_TIMEOUT_MINUTES);

        // Game expiration takes priority
        List<Game> expiredGames = gameRepository.findExpiredGames(gameDeadline);
        Set<UUID> cancelledGameIds = expiredGames.stream()
                .map(Game::getId)
                .collect(Collectors.toSet());

        for (Game game : expiredGames) {
            handleGameExpiration(game);
        }

        // Turn expiration — skip games already cancelled above
        List<Game> expiredTurns = gameRepository.findGamesWithExpiredTurns(turnDeadline);
        for (Game game : expiredTurns) {
            if (cancelledGameIds.contains(game.getId())) {
                continue;
            }
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

        // The player who timed out loses
        User loser = game.getCurrentTurn();
        User winner = getOpponent(game, loser);

        game.setPhase(GamePhase.FINISHED);
        game.setEndedAt(LocalDateTime.now());

        int totalTurns = game.getBlueBoard().getShots().size() + game.getRedBoard().getShots().size();

        GameResult gameResult = GameResult.builder()
                .game(game)
                .winner(winner)
                .loser(loser)
                .turns(totalTurns)
                .build();
        gameResultRepository.save(gameResult);

        winner.setWins(winner.getWins() + 1);
        loser.setLosses(loser.getLosses() + 1);

        long bountyDelta = bountyService.updateBounties(winner, loser);
        game.setBountyDelta(bountyDelta);

        gameRepository.save(game);

        String gameToken = game.getToken();
        String winnerName = winner.getName();
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    gameEventEmitter.emitGameOver(gameToken, winnerName);
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
