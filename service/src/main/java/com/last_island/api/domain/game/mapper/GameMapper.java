package com.last_island.api.domain.game.mapper;

import com.last_island.api.domain.board.dto.MyBoardResponse;
import com.last_island.api.domain.board.dto.OpponentBoardResponse;
import com.last_island.api.domain.board.entity.Board;
import com.last_island.api.domain.board.entity.Ship;
import com.last_island.api.domain.board.mapper.BoardMapper;
import com.last_island.api.domain.game.dto.BattleLogEntryResponse;
import com.last_island.api.domain.game.dto.CreateGameResponse;
import com.last_island.api.domain.game.dto.GameResponse;
import com.last_island.api.domain.game.dto.GameStateResponse;
import com.last_island.api.domain.game.dto.GameSummaryResponse;
import com.last_island.api.domain.game.entity.Game;
import com.last_island.api.domain.game.entity.GameResult;
import com.last_island.api.domain.game.enums.GamePhase;
import com.last_island.api.domain.user.entity.User;

import java.time.Duration;
import java.util.UUID;

public final class GameMapper {

    private GameMapper() {
    }

    public static CreateGameResponse toCreateResponse(Game game) {
        return new CreateGameResponse(
                game.getId(),
                game.getToken(),
                game.getPhase().name(),
                game.getCreatedAt()
        );
    }

    public static GameResponse toResponse(Game game) {
        String redPlayerName = game.getRedBoard() != null
                ? game.getRedBoard().getOwner().getName()
                : null;

        String currentTurnPlayerName = game.getCurrentTurn() != null
                ? game.getCurrentTurn().getName()
                : null;

        return new GameResponse(
                game.getId(),
                game.getToken(),
                game.getPhase().name(),
                game.getBlueBoard().getOwner().getName(),
                redPlayerName,
                currentTurnPlayerName,
                game.getStartedAt(),
                game.getCreatedAt()
        );
    }

    public static GameSummaryResponse toSummaryResponse(Game game) {
        return new GameSummaryResponse(
                game.getId(),
                game.getToken(),
                game.getBlueBoard().getOwner().getName(),
                game.getCreatedAt()
        );
    }

    public static GameStateResponse toStateResponse(Game game, UUID userId) {
        String redPlayerName = game.getRedBoard() != null
                ? game.getRedBoard().getOwner().getName()
                : null;

        String currentTurnPlayerName = game.getCurrentTurn() != null
                ? game.getCurrentTurn().getName()
                : null;

        User blueOwner = game.getBlueBoard().getOwner();
        String bluePlayerAvatar = blueOwner.getAvatar() != null ? blueOwner.getAvatar().name() : null;

        String bluePlayerRank = blueOwner.getRank();
        Long bluePlayerBounty = blueOwner.getBounty();
        Integer bluePlayerWins = blueOwner.getWins();
        Integer bluePlayerAccuracy = blueOwner.getTotalShots() > 0
                ? blueOwner.getTotalHits() * 100 / blueOwner.getTotalShots()
                : null;

        String redPlayerAvatar = null;
        String redPlayerRank = null;
        Long redPlayerBounty = null;
        Integer redPlayerWins = null;
        Integer redPlayerAccuracy = null;
        if (game.getRedBoard() != null) {
            User redOwner = game.getRedBoard().getOwner();
            redPlayerAvatar = redOwner.getAvatar() != null ? redOwner.getAvatar().name() : null;
            redPlayerRank = redOwner.getRank();
            redPlayerBounty = redOwner.getBounty();
            redPlayerWins = redOwner.getWins();
            redPlayerAccuracy = redOwner.getTotalShots() > 0
                    ? redOwner.getTotalHits() * 100 / redOwner.getTotalShots()
                    : null;
        }

        Long bountyDelta = game.getBountyDelta();

        Board myBoard;
        Board opponentBoard;
        if (game.getBlueBoard().getOwner().getId().equals(userId)) {
            myBoard = game.getBlueBoard();
            opponentBoard = game.getRedBoard();
        } else {
            myBoard = game.getRedBoard();
            opponentBoard = game.getBlueBoard();
        }

        MyBoardResponse myBoardResponse = BoardMapper.toMyBoardResponse(myBoard);
        OpponentBoardResponse opponentBoardResponse = opponentBoard != null
                ? BoardMapper.toOpponentBoardResponse(opponentBoard)
                : null;

        String winnerName = null;
        if (game.getPhase() == GamePhase.FINISHED) {
            winnerName = determineWinner(game);
        }

        return new GameStateResponse(
                game.getId(),
                game.getToken(),
                game.getPhase().name(),
                game.getBlueBoard().getOwner().getName(),
                bluePlayerAvatar,
                redPlayerName,
                redPlayerAvatar,
                bluePlayerRank,
                redPlayerRank,
                bluePlayerBounty,
                redPlayerBounty,
                bluePlayerWins,
                redPlayerWins,
                bluePlayerAccuracy,
                redPlayerAccuracy,
                bountyDelta,
                currentTurnPlayerName,
                winnerName,
                game.getStartedAt(),
                game.getEndedAt(),
                game.getTurnStartedAt(),
                game.getCreatedAt(),
                myBoardResponse,
                opponentBoardResponse
        );
    }

    private static String determineWinner(Game game) {
        if (game.getPhase() == GamePhase.CANCELLED) {
            return null;
        }

        Board blueBoard = game.getBlueBoard();
        Board redBoard = game.getRedBoard();

        // Check if all ships sunk (normal game over)
        if (redBoard != null && redBoard.getShips().stream().allMatch(Ship::isSunk)) {
            return blueBoard.getOwner().getName();
        }
        if (blueBoard.getShips().stream().allMatch(Ship::isSunk)) {
            return redBoard != null ? redBoard.getOwner().getName() : null;
        }

        // Fallback: check GameResult (surrender, turn expiration)
        if (game.getGameResult() != null) {
            return game.getGameResult().getWinner().getName();
        }

        return null;
    }

    public static BattleLogEntryResponse toBattleLogEntry(GameResult gr, UUID userId) {
        boolean isWinner = gr.getWinner().getId().equals(userId);
        String result = isWinner ? "VICTORY" : "DEFEAT";

        User opponent = isWinner ? gr.getLoser() : gr.getWinner();

        Game game = gr.getGame();

        Board opponentBoard;
        if (game.getBlueBoard().getOwner().getId().equals(userId)) {
            opponentBoard = game.getRedBoard();
        } else {
            opponentBoard = game.getBlueBoard();
        }

        int shotsFired = opponentBoard != null ? opponentBoard.getShots().size() : 0;
        long shipsSunk = opponentBoard != null
                ? opponentBoard.getShips().stream().filter(Ship::isSunk).count()
                : 0;

        String duration = formatDuration(game.getDuration());
        String date = game.getEndedAt() != null ? game.getEndedAt().toString() : null;

        return new BattleLogEntryResponse(
                game.getId(),
                game.getToken(),
                opponent.getName(),
                result,
                date,
                shotsFired,
                shipsSunk,
                duration
        );
    }

    private static String formatDuration(Duration duration) {
        if (duration == null) {
            return null;
        }
        long totalSeconds = duration.getSeconds();
        long minutes = totalSeconds / 60;
        long seconds = totalSeconds % 60;
        return minutes + "m " + seconds + "s";
    }
}
