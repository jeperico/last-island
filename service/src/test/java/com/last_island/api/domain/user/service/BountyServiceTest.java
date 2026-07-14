package com.last_island.api.domain.user.service;

import com.last_island.api.domain.user.entity.User;
import com.last_island.api.domain.user.enums.Filiation;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class BountyServiceTest {

    private BountyService bountyService;

    @BeforeEach
    void setUp() {
        bountyService = new BountyService();
    }

    @Test
    void updateBounties_equalRatings_winnerGains80_loserLoses80() {
        User winner = buildUser("Luffy", Filiation.PIRATE, 1000);
        User loser = buildUser("Akainu", Filiation.MARINE, 1000);

        bountyService.updateBounties(winner, loser);

        assertThat(winner.getBounty()).isEqualTo(1080);
        assertThat(loser.getBounty()).isEqualTo(920);
    }

    @Test
    void updateBounties_underdogWins_bigGain() {
        User underdog = buildUser("Luffy", Filiation.PIRATE, 800);
        User favorite = buildUser("Kaido", Filiation.PIRATE, 1200);

        bountyService.updateBounties(underdog, favorite);

        // Underdog gains more than 80 (expected score ~0.24, gain ~122)
        assertThat(underdog.getBounty()).isGreaterThan(880);
        // Favorite loses more than 80
        assertThat(favorite.getBounty()).isLessThan(1120);
    }

    @Test
    void updateBounties_favoriteWins_smallGain() {
        User favorite = buildUser("Kaido", Filiation.PIRATE, 1200);
        User underdog = buildUser("Luffy", Filiation.PIRATE, 800);

        bountyService.updateBounties(favorite, underdog);

        // Favorite gains less than 80 (expected score ~0.76, gain ~38)
        assertThat(favorite.getBounty()).isLessThan(1280);
        assertThat(favorite.getBounty()).isGreaterThan(1200);
        // Underdog loses less than 80
        assertThat(underdog.getBounty()).isLessThan(800);
        assertThat(underdog.getBounty()).isGreaterThan(720);
    }

    @Test
    void updateBounties_bountyFloor_cannotGoNegative() {
        User winner = buildUser("Luffy", Filiation.PIRATE, 1000);
        User loser = buildUser("Buggy", Filiation.PIRATE, 5);

        bountyService.updateBounties(winner, loser);

        assertThat(loser.getBounty()).isGreaterThanOrEqualTo(0);
    }

    @Test
    void updateBounties_rankPromotion_crossesThreshold() {
        // Winner at 1490 crosses 1500 → SUPERNOVA
        User winner = buildUser("Luffy", Filiation.PIRATE, 1490);
        User loser = buildUser("Akainu", Filiation.MARINE, 1490);

        bountyService.updateBounties(winner, loser);

        assertThat(winner.getBounty()).isGreaterThanOrEqualTo(1500);
        assertThat(winner.getRank()).isEqualTo("SUPERNOVA");
    }

    @Test
    void updateBounties_rankDemotion_dropsBelowThreshold() {
        // Loser at 1010 drops below 1000 → ROOKIE
        User winner = buildUser("Akainu", Filiation.MARINE, 1010);
        User loser = buildUser("Luffy", Filiation.PIRATE, 1010);

        bountyService.updateBounties(winner, loser);

        assertThat(loser.getBounty()).isLessThan(1000);
        assertThat(loser.getRank()).isEqualTo("ROOKIE");
    }

    @Test
    void updateBounties_marineRankPromotion() {
        User winner = buildUser("Garp", Filiation.MARINE, 1490);
        User loser = buildUser("Luffy", Filiation.PIRATE, 1490);

        bountyService.updateBounties(winner, loser);

        assertThat(winner.getBounty()).isGreaterThanOrEqualTo(1500);
        assertThat(winner.getRank()).isEqualTo("COMMODORE");
    }

    @Test
    void computeRank_pirateThresholds() {
        assertThat(BountyService.computeRank(0, Filiation.PIRATE)).isEqualTo("ROOKIE");
        assertThat(BountyService.computeRank(999, Filiation.PIRATE)).isEqualTo("ROOKIE");
        assertThat(BountyService.computeRank(1000, Filiation.PIRATE)).isEqualTo("SUPER_ROOKIE");
        assertThat(BountyService.computeRank(1499, Filiation.PIRATE)).isEqualTo("SUPER_ROOKIE");
        assertThat(BountyService.computeRank(1500, Filiation.PIRATE)).isEqualTo("SUPERNOVA");
        assertThat(BountyService.computeRank(1999, Filiation.PIRATE)).isEqualTo("SUPERNOVA");
        assertThat(BountyService.computeRank(2000, Filiation.PIRATE)).isEqualTo("SHICHIBUKAI");
        assertThat(BountyService.computeRank(2499, Filiation.PIRATE)).isEqualTo("SHICHIBUKAI");
        assertThat(BountyService.computeRank(2500, Filiation.PIRATE)).isEqualTo("YONKO");
        assertThat(BountyService.computeRank(2999, Filiation.PIRATE)).isEqualTo("YONKO");
        assertThat(BountyService.computeRank(3000, Filiation.PIRATE)).isEqualTo("PIRATE_KING");
    }

    @Test
    void computeRank_marineThresholds() {
        assertThat(BountyService.computeRank(0, Filiation.MARINE)).isEqualTo("SEAMAN");
        assertThat(BountyService.computeRank(999, Filiation.MARINE)).isEqualTo("SEAMAN");
        assertThat(BountyService.computeRank(1000, Filiation.MARINE)).isEqualTo("CAPTAIN");
        assertThat(BountyService.computeRank(1499, Filiation.MARINE)).isEqualTo("CAPTAIN");
        assertThat(BountyService.computeRank(1500, Filiation.MARINE)).isEqualTo("COMMODORE");
        assertThat(BountyService.computeRank(1999, Filiation.MARINE)).isEqualTo("COMMODORE");
        assertThat(BountyService.computeRank(2000, Filiation.MARINE)).isEqualTo("VICE_ADMIRAL");
        assertThat(BountyService.computeRank(2499, Filiation.MARINE)).isEqualTo("VICE_ADMIRAL");
        assertThat(BountyService.computeRank(2500, Filiation.MARINE)).isEqualTo("ADMIRAL");
        assertThat(BountyService.computeRank(2999, Filiation.MARINE)).isEqualTo("ADMIRAL");
        assertThat(BountyService.computeRank(3000, Filiation.MARINE)).isEqualTo("FLEET_ADMIRAL");
    }

    private User buildUser(String name, Filiation filiation, long bounty) {
        return User.builder()
                .name(name)
                .filiation(filiation)
                .bounty(bounty)
                .rank(BountyService.computeRank(bounty, filiation))
                .wins(0)
                .losses(0)
                .totalShots(0)
                .totalHits(0)
                .build();
    }
}
