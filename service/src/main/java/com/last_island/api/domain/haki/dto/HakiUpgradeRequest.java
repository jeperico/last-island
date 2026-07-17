package com.last_island.api.domain.haki.dto;

import com.last_island.api.domain.haki.enums.HakiType;

public record HakiUpgradeRequest(
    HakiType hakiType,
    int targetLevel
) {}
