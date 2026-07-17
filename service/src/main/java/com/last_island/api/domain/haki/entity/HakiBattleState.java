package com.last_island.api.domain.haki.entity;

import com.last_island.api.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "haki_battle_state")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class HakiBattleState extends BaseEntity {

    @Column(name = "board_id", nullable = false, unique = true)
    private UUID boardId;

    @Column(name = "observation_uses_remaining", nullable = false)
    private int observationUsesRemaining;

    @Column(name = "observation_uses_consumed", nullable = false)
    private int observationUsesConsumed;

    @Column(name = "observation_level", nullable = false)
    private int observationLevel;

    @Column(name = "conquerors_uses_remaining", nullable = false)
    @Builder.Default
    private int conquerorsUsesRemaining = 0;

    @Column(name = "haki_used_this_turn", nullable = false)
    private boolean hakiUsedThisTurn;
}
