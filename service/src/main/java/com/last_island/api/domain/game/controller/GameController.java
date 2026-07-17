package com.last_island.api.domain.game.controller;

import com.last_island.api.common.dto.PageResponse;
import com.last_island.api.domain.board.dto.BoardResponse;
import com.last_island.api.domain.board.dto.PlaceShipsRequest;
import com.last_island.api.domain.board.dto.ShotRequest;
import com.last_island.api.domain.board.dto.ShotResponse;
import com.last_island.api.domain.board.service.BoardService;
import com.last_island.api.domain.game.dto.BattleLogEntryResponse;
import com.last_island.api.domain.game.dto.CreateGameResponse;
import com.last_island.api.domain.game.dto.GameResponse;
import com.last_island.api.domain.game.dto.GameStateResponse;
import com.last_island.api.domain.game.dto.GameSummaryResponse;
import com.last_island.api.domain.game.service.BattleLogService;
import com.last_island.api.domain.game.service.GameService;
import com.last_island.api.infrastructure.security.principal.AuthenticatedUser;
import com.last_island.api.infrastructure.sse.SseConnectionRegistry;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Battles")
@RestController
@RequestMapping("/games")
public class GameController {

    private final GameService gameService;
    private final BoardService boardService;
    private final SseConnectionRegistry sseConnectionRegistry;
    private final BattleLogService battleLogService;

    public GameController(GameService gameService, BoardService boardService,
                          SseConnectionRegistry sseConnectionRegistry, BattleLogService battleLogService) {
        this.gameService = gameService;
        this.boardService = boardService;
        this.sseConnectionRegistry = sseConnectionRegistry;
        this.battleLogService = battleLogService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CreateGameResponse createGame(@AuthenticationPrincipal AuthenticatedUser principal) {
        return gameService.createGame(principal.getId());
    }

    @PostMapping("/{token}")
    public GameResponse joinGame(@PathVariable String token,
                                 @AuthenticationPrincipal AuthenticatedUser principal) {
        return gameService.joinGame(token, principal.getId());
    }

    @GetMapping
    public PageResponse<GameSummaryResponse> listGames(Pageable pageable) {
        return gameService.listGames(pageable);
    }

    @GetMapping("/history")
    public PageResponse<BattleLogEntryResponse> getBattleLog(@AuthenticationPrincipal AuthenticatedUser principal, Pageable pageable) {
        return battleLogService.getBattleLog(principal.getId(), pageable);
    }

    @GetMapping("/{token}")
    public GameStateResponse getGame(@PathVariable String token,
                                @AuthenticationPrincipal AuthenticatedUser principal) {
        return gameService.getGame(token, principal.getId());
    }

    @PostMapping("/{token}/place-ships")
    public BoardResponse placeShips(@PathVariable String token,
                                    @RequestBody PlaceShipsRequest request,
                                    @AuthenticationPrincipal AuthenticatedUser principal) {
        return boardService.placeShips(token, principal.getId(), request);
    }

    @PostMapping("/{token}/shots")
    public ShotResponse fireShot(@PathVariable String token,
                                 @RequestBody ShotRequest request,
                                 @AuthenticationPrincipal AuthenticatedUser principal) {
        return boardService.fireShot(token, principal.getId(), request);
    }

    @PostMapping("/{token}/cancel")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelGame(@PathVariable String token,
                           @AuthenticationPrincipal AuthenticatedUser principal) {
        gameService.cancelGame(token, principal.getId());
    }

    @PostMapping("/{token}/surrender")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void surrender(@PathVariable String token,
                          @AuthenticationPrincipal AuthenticatedUser principal) {
        gameService.surrender(token, principal.getId());
    }

    @GetMapping(value = "/{token}/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(@PathVariable String token,
                                @RequestHeader(value = "Last-Event-ID", required = false) String lastEventId,
                                @AuthenticationPrincipal AuthenticatedUser principal) {
        gameService.validateParticipant(token, principal.getId());

        SseEmitter emitter = sseConnectionRegistry.register(token, principal.getId());

        if (lastEventId != null) {
            try {
                long lastId = Long.parseLong(lastEventId);
                sseConnectionRegistry.replayEvents(token, principal.getId(), lastId);
            } catch (NumberFormatException e) {
                // Invalid Last-Event-ID, ignore replay
            }
        }

        return emitter;
    }
}
