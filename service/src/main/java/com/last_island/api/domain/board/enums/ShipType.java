package com.last_island.api.domain.board.enums;

import com.last_island.api.domain.user.enums.Filiation;
import lombok.Getter;

@Getter
public enum ShipType {

    THOUSAND_SUNNY(5, Filiation.PIRATA),
    MOBY_DICK(4, Filiation.PIRATA),
    RED_FORCE(3, Filiation.PIRATA),
    POLAR_TANG(3, Filiation.PIRATA),
    GOING_MERRY(2, Filiation.PIRATA),

    BUSTER_CALL(5, Filiation.MARINHA),
    COURACADO(4, Filiation.MARINHA),
    FRAGATA(3, Filiation.MARINHA),
    DESTROYER(3, Filiation.MARINHA),
    PATRULHA(2, Filiation.MARINHA);

    private final int size;
    private final Filiation filiation;

    ShipType(int size, Filiation filiation) {
        this.size = size;
        this.filiation = filiation;
    }
}
