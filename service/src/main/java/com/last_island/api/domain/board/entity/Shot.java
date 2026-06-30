package com.last_island.api.domain.board.entity;

import com.last_island.api.common.entity.BaseEntity;
import com.last_island.api.domain.board.enums.ShotResult;
import com.last_island.api.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "shots")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class Shot extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    @ToString.Exclude
    private Board board;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attacker_id", nullable = false)
    @ToString.Exclude
    private User attacker;

    @Column(nullable = false)
    private int row;

    @Column(nullable = false)
    private int col;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShotResult result;
}
