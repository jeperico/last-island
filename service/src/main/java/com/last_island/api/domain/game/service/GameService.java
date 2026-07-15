package com.last_island.api.domain.game.service;

import com.last_island.api.common.dto.PageResponse;
import com.last_island.api.common.mapper.PageMapper;
import com.last_island.api.domain.board.entity.Board;
import com.last_island.api.domain.game.dto.CreateGameResponse;
import com.last_island.api.domain.game.dto.GameResponse;
import com.last_island.api.domain.game.dto.GameStateResponse;
import com.last_island.api.domain.game.dto.GameSummaryResponse;
import com.last_island.api.domain.game.entity.Game;
import com.last_island.api.domain.game.enums.GamePhase;
import com.last_island.api.domain.game.mapper.GameMapper;
import com.last_island.api.domain.game.entity.GameResult;
import com.last_island.api.domain.game.repository.GameRepository;
import com.last_island.api.domain.game.repository.GameResultRepository;
import com.last_island.api.domain.user.entity.User;
import com.last_island.api.domain.user.repository.UserRepository;
import com.last_island.api.domain.user.service.BountyService;
import com.last_island.api.infrastructure.sse.GameEventEmitter;
import com.last_island.api.infrastructure.sse.LobbyEventEmitter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class GameService {

    private final GameRepository gameRepository;
    private final GameResultRepository gameResultRepository;
    private final UserRepository userRepository;
    private final GameEventEmitter gameEventEmitter;
    private final LobbyEventEmitter lobbyEventEmitter;
    private final BountyService bountyService;

    public GameService(GameRepository gameRepository, GameResultRepository gameResultRepository,
                       UserRepository userRepository,
                       GameEventEmitter gameEventEmitter, LobbyEventEmitter lobbyEventEmitter,
                       BountyService bountyService) {
        this.gameRepository = gameRepository;
        this.gameResultRepository = gameResultRepository;
        this.userRepository = userRepository;
        this.gameEventEmitter = gameEventEmitter;
        this.lobbyEventEmitter = lobbyEventEmitter;
        this.bountyService = bountyService;
    }

    @Transactional
    public CreateGameResponse createGame(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pirate not found"));

        String token = generateUniqueToken();

        Board blueBoard = Board.builder()
                .owner(user)
                .build();

        Game game = Game.builder()
                .blueBoard(blueBoard)
                .phase(GamePhase.WAITING_OPPONENT)
                .token(token)
                .build();

        gameRepository.save(game);

        String bluePlayerName = user.getName();
        LocalDateTime createdAt = game.getCreatedAt();
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    lobbyEventEmitter.emitGameCreated(token, bluePlayerName, createdAt);
                }
            });
        }

        return GameMapper.toCreateResponse(game);
    }

    @Transactional
    public GameResponse joinGame(String token, UUID userId) {
        Game game = gameRepository.findByTokenAndIsActiveTrue(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Battle not found"));

        if (game.getPhase() != GamePhase.WAITING_OPPONENT) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This battle is not accepting new pirates");
        }

        if (game.getBlueBoard().getOwner().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot join your own battle");
        }

        User joiner = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pirate not found"));

        Board redBoard = Board.builder()
                .owner(joiner)
                .build();

        game.setRedBoard(redBoard);
        game.setPhase(GamePhase.PLACING_SHIPS);

        User firstTurn = ThreadLocalRandom.current().nextBoolean()
                ? game.getBlueBoard().getOwner()
                : joiner;
        game.setCurrentTurn(firstTurn);

        gameRepository.save(game);

        UUID bluePlayerId = game.getBlueBoard().getOwner().getId();
        String joinerName = joiner.getName();
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    gameEventEmitter.emitOpponentJoined(token, bluePlayerId, joinerName);
                    lobbyEventEmitter.emitGameRemoved(token);
                }
            });
        }

        return GameMapper.toResponse(game);
    }

    @Transactional(readOnly = true)
    public PageResponse<GameSummaryResponse> listGames(Pageable pageable) {
        Page<GameSummaryResponse> page = gameRepository
                .findByPhaseAndIsActiveTrue(GamePhase.WAITING_OPPONENT, pageable)
                .map(GameMapper::toSummaryResponse);

        return PageMapper.toPageResponse(page);
    }

    @Transactional(readOnly = true)
    public GameStateResponse getGame(String token, UUID userId) {
        Game game = gameRepository.findByTokenAndIsActiveTrue(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Battle not found"));

        boolean isBlue = game.getBlueBoard().getOwner().getId().equals(userId);
        boolean isRed = game.getRedBoard() != null && game.getRedBoard().getOwner().getId().equals(userId);

        if (!isBlue && !isRed) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not a participant in this battle");
        }

        return GameMapper.toStateResponse(game, userId);
    }

    @Transactional(readOnly = true)
    public void validateParticipant(String token, UUID userId) {
        Game game = gameRepository.findByTokenAndIsActiveTrue(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Battle not found"));

        boolean isBlue = game.getBlueBoard().getOwner().getId().equals(userId);
        boolean isRed = game.getRedBoard() != null && game.getRedBoard().getOwner().getId().equals(userId);

        if (!isBlue && !isRed) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not a participant in this battle");
        }
    }

    @Transactional
    public void surrender(String token, UUID userId) {
        Game game = gameRepository.findByTokenAndIsActiveTrue(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Battle not found"));

        // Validate participant
        boolean isBlue = game.getBlueBoard().getOwner().getId().equals(userId);
        boolean isRed = game.getRedBoard() != null && game.getRedBoard().getOwner().getId().equals(userId);

        if (!isBlue && !isRed) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not a participant in this battle");
        }

        // Validate phase allows surrender
        if (game.getPhase() != GamePhase.PLACING_SHIPS && game.getPhase() != GamePhase.IN_PROGRESS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot surrender — battle is not in progress");
        }

        // During PLACING_SHIPS: just cancel the game (no win/loss recorded)
        if (game.getPhase() == GamePhase.PLACING_SHIPS) {
            game.setPhase(GamePhase.CANCELLED);
            game.setEndedAt(LocalDateTime.now());
            gameRepository.save(game);

            UUID opponentId = isBlue ? game.getRedBoard().getOwner().getId() : game.getBlueBoard().getOwner().getId();
            String surrenderedPlayerName = isBlue ? game.getBlueBoard().getOwner().getName() : game.getRedBoard().getOwner().getName();
            if (TransactionSynchronizationManager.isSynchronizationActive()) {
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        gameEventEmitter.emitSurrender(token, opponentId, surrenderedPlayerName);
                    }
                });
            }
            return;
        }

        // IN_PROGRESS: finish the game with a recorded loss
        game.setPhase(GamePhase.FINISHED);
        game.setEndedAt(LocalDateTime.now());

        // Determine winner and loser
        User loser = isBlue ? game.getBlueBoard().getOwner() : game.getRedBoard().getOwner();
        User winner = isBlue ? game.getRedBoard().getOwner() : game.getBlueBoard().getOwner();

        // Calculate turns
        int totalTurns = 0;
        if (game.getBlueBoard().getShots() != null) {
            totalTurns += game.getBlueBoard().getShots().size();
        }
        if (game.getRedBoard() != null && game.getRedBoard().getShots() != null) {
            totalTurns += game.getRedBoard().getShots().size();
        }

        // Create GameResult
        GameResult gameResult = GameResult.builder()
                .game(game)
                .winner(winner)
                .loser(loser)
                .turns(totalTurns)
                .build();
        gameResultRepository.save(gameResult);

        // Update wins/losses
        winner.setWins(winner.getWins() + 1);
        loser.setLosses(loser.getLosses() + 1);

        long bountyDelta = bountyService.updateBounties(winner, loser);
        game.setBountyDelta(bountyDelta);

        gameRepository.save(game);

        // Emit SURRENDER event to opponent after commit
        UUID opponentId = winner.getId();
        String surrenderedPlayerName = loser.getName();
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    gameEventEmitter.emitSurrender(token, opponentId, surrenderedPlayerName);
                }
            });
        }
    }

    private String generateUniqueToken() {
        for (int i = 0; i < 10; i++) {
            int n = ThreadLocalRandom.current().nextInt(100000, 1000000);
            String token = String.valueOf(n);
            if (!gameRepository.existsByToken(token)) {
                return token;
            }
        }
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to generate unique battle token");
    }
}
