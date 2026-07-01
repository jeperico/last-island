package com.last_island.api.domain.board.enums;

import com.last_island.api.domain.user.enums.Filiation;
import lombok.Getter;

@Getter
public enum ShipType {

    THOUSAND_SUNNY(5, Filiation.PIRATE),
    MOBY_DICK(4, Filiation.PIRATE),
    RED_FORCE(3, Filiation.PIRATE),
    POLAR_TANG(3, Filiation.PIRATE),
    STRIKER(2, Filiation.PIRATE),

    BUSTER_CALL(5, Filiation.MARINE),
    WARSHIP(4, Filiation.MARINE),
    BATTLESHIP(3, Filiation.MARINE),
    CRUISER(3, Filiation.MARINE),
    CUTTER(2, Filiation.MARINE);

    private final int size;
    private final Filiation filiation;

    ShipType(int size, Filiation filiation) {
        this.size = size;
        this.filiation = filiation;
    }
}
