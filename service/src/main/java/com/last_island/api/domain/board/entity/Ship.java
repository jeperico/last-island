package com.last_island.api.domain.board.entity;

import com.last_island.api.common.entity.BaseEntity;
import com.last_island.api.domain.board.enums.Orientation;
import com.last_island.api.domain.board.enums.ShipType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ships")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class Ship extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    @ToString.Exclude
    private Board board;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShipType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Orientation orientation;

    @Column(nullable = false)
    private int row;

    @Column(nullable = false)
    private int col;

    private int hits;

    public boolean isSunk() {
        return hits >= type.getSize();
    }
}
