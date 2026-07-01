package com.last_island.api.domain.game.controller;

import com.last_island.api.common.dto.PageResponse;
import com.last_island.api.domain.board.dto.BoardResponse;
import com.last_island.api.domain.board.dto.PlaceShipsRequest;
import com.last_island.api.domain.board.dto.ShotRequest;
import com.last_island.api.domain.board.dto.ShotResponse;
import com.last_island.api.domain.board.service.BoardService;
import com.last_island.api.domain.game.dto.CreateGameResponse;
import com.last_island.api.domain.game.dto.GameResponse;
import com.last_island.api.domain.game.dto.GameStateResponse;
import com.last_island.api.domain.game.dto.GameSummaryResponse;
import com.last_island.api.domain.game.service.GameService;
import com.last_island.api.infrastructure.security.principal.AuthenticatedUser;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Battles")
@RestController
@RequestMapping("/games")
public class GameController {

    private final GameService gameService;
    private final BoardService boardService;

    public GameController(GameService gameService, BoardService boardService) {
        this.gameService = gameService;
        this.boardService = boardService;
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
}
