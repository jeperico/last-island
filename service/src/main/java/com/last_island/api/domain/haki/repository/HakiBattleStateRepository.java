package com.last_island.api.domain.haki.repository;

import com.last_island.api.domain.haki.entity.HakiBattleState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface HakiBattleStateRepository extends JpaRepository<HakiBattleState, UUID> {

    Optional<HakiBattleState> findByBoardId(UUID boardId);

    @Modifying
    @Query("DELETE FROM HakiBattleState h WHERE h.boardId = :boardId")
    void deleteByBoardId(UUID boardId);
}
