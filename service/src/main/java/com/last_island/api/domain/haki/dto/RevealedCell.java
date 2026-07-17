package com.last_island.api.domain.haki.dto;

import com.last_island.api.domain.haki.enums.CellRevealStatus;

public record RevealedCell(int row, int col, CellRevealStatus status) {
}
