package com.last_island.api.domain.game.service;

import com.last_island.api.domain.game.dto.BattleLogEntryResponse;
import com.last_island.api.domain.game.mapper.GameMapper;
import com.last_island.api.domain.game.repository.GameResultRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class BattleLogService {

    private final GameResultRepository gameResultRepository;

    public BattleLogService(GameResultRepository gameResultRepository) {
        this.gameResultRepository = gameResultRepository;
    }

    @Transactional(readOnly = true)
    public List<BattleLogEntryResponse> getBattleLog(UUID userId) {
        return gameResultRepository
                .findTop10ByUserIdOrderByEndedAtDesc(userId, PageRequest.of(0, 10))
                .stream()
                .map(gr -> GameMapper.toBattleLogEntry(gr, userId))
                .toList();
    }
}
