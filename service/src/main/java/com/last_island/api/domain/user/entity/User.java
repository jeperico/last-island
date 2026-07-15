package com.last_island.api.domain.user.entity;

import com.last_island.api.common.entity.BaseEntity;
import com.last_island.api.domain.user.enums.Avatar;
import com.last_island.api.domain.user.enums.Filiation;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class User extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Filiation filiation;

    @Enumerated(EnumType.STRING)
    private Avatar avatar;

    private long bounty;

    @Column(nullable = false)
    private String rank;

    private int wins;

    private int losses;

    private int totalShots;

    private int totalHits;

    public double getWinRate() {
        return (wins + losses) == 0 ? 0.0 : (double) wins / (wins + losses);
    }

    public double getAccuracy() {
        return totalShots == 0 ? 0.0 : (double) totalHits / totalShots;
    }
}
