package com.last_island.api.domain.haki.dto;

public record HakiProfileResponse(
    int hakiPoints,
    int hakiPointsAvailable,
    int observationLevel,
    int armamentLevel,
    int conquerorsLevel,
    int bountyMilestonesReached
) {}
