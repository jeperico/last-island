package com.last_island.api.domain.game.service;

import com.last_island.api.common.dto.PageResponse;
import com.last_island.api.domain.game.dto.BattleLogEntryResponse;
import com.last_island.api.domain.game.mapper.GameMapper;
import com.last_island.api.domain.game.repository.GameResultRepository;
import org.springframework.data.domain.Pageable;
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
    public PageResponse<BattleLogEntryResponse> getBattleLog(UUID userId, Pageable pageable) {
        var results = gameResultRepository.findByUserIdOrderByEndedAtDesc(userId, pageable);
        List<BattleLogEntryResponse> content = results.getContent().stream()
                .map(gr -> GameMapper.toBattleLogEntry(gr, userId))
                .toList();
        return new PageResponse<>(
                content,
                results.getNumber(),
                results.getSize(),
                results.getTotalElements(),
                results.getTotalPages(),
                results.isLast()
        );
    }
}
