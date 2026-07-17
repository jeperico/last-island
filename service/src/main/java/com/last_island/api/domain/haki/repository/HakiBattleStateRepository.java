package com.last_island.api.domain.haki.repository;

import com.last_island.api.domain.haki.entity.HakiBattleState;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface HakiBattleStateRepository extends JpaRepository<HakiBattleState, UUID> {

    Optional<HakiBattleState> findByBoardId(UUID boardId);
}
