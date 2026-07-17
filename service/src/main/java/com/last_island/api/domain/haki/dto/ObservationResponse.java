package com.last_island.api.domain.haki.dto;

import java.util.List;

public record ObservationResponse(List<RevealedCell> revealedCells, String effectLevel) {
}
