package com.last_island.api.domain.haki.entity;

import com.last_island.api.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "haki_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class HakiProfile extends BaseEntity {

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(name = "haki_points", nullable = false)
    private int hakiPoints;

    @Column(name = "haki_points_available", nullable = false)
    private int hakiPointsAvailable;

    @Column(name = "observation_level", nullable = false)
    private int observationLevel;

    @Column(name = "armament_level", nullable = false)
    private int armamentLevel;

    @Column(name = "conquerors_level", nullable = false)
    private int conquerorsLevel;

    @Column(name = "bounty_milestones_reached", nullable = false)
    private int bountyMilestonesReached;
}
