package com.last_island.api.domain.haki.dto;

import java.util.List;

public record ConquerorsActivationResponse(int skipTurns, String effectLevel, List<XPatternShotResult> xPatternShots) {
}
