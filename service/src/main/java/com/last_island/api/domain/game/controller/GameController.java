package com.last_island.api.domain.game.controller;

import com.last_island.api.common.dto.PageResponse;
import com.last_island.api.domain.game.dto.CreateGameResponse;
import com.last_island.api.domain.game.dto.GameResponse;
import com.last_island.api.domain.game.dto.GameSummaryResponse;
import com.last_island.api.domain.game.service.GameService;
import com.last_island.api.infrastructure.security.principal.AuthenticatedUser;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/games")
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
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
    public GameResponse getGame(@PathVariable String token,
                                @AuthenticationPrincipal AuthenticatedUser principal) {
        return gameService.getGame(token, principal.getId());
    }
}
