package com.last_island.api.domain.board.repository;

import com.last_island.api.domain.board.entity.Board;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface BoardRepository extends JpaRepository<Board, UUID> {
}
