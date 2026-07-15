package com.last_island.api.domain.board.enums;

import lombok.Getter;

@Getter
public enum ShipType {

    THOUSAND_SUNNY(5),
    MOBY_DICK(4),
    RED_FORCE(3),
    POLAR_TANG(3),
    STRIKER(2),

    /** Legacy — historical game data */
    @Deprecated
    BUSTER_CALL(5),
    /** Legacy — historical game data */
    @Deprecated
    WARSHIP(4),
    /** Legacy — historical game data */
    @Deprecated
    BATTLESHIP(3),
    /** Legacy — historical game data */
    @Deprecated
    CRUISER(3),
    /** Legacy — historical game data */
    @Deprecated
    CUTTER(2);

    private final int size;

    ShipType(int size) {
        this.size = size;
    }
}
