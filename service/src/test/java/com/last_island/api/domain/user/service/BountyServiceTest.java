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
    void updateBounties_equalRatings_winnerGainsSignificant() {
        User winner = buildUser("Luffy", Filiation.PIRATE, 50_000_000L);
        User loser = buildUser("Akainu", Filiation.MARINE, 50_000_000L);

        bountyService.updateBounties(winner, loser);

        // Low-elo players use K*2 = 320, expected=0.5, gain = 320*0.5 = 160M but min is 5M
        assertThat(winner.getBounty()).isGreaterThan(50_000_000L);
        assertThat(loser.getBounty()).isLessThan(50_000_000L);
        // Loser protected: loses at most 30% of winner's gain
        assertThat(loser.getBounty()).isGreaterThan(1_000_000L);
    }

    @Test
    void updateBounties_lowEloProtection_loserLosesLittle() {
        User winner = buildUser("Luffy", Filiation.PIRATE, 50_000_000L);
        User loser = buildUser("Buggy", Filiation.PIRATE, 10_000_000L);

        bountyService.updateBounties(winner, loser);

        // Loser is low-bounty (<100M), should lose at most 30% of winner gain
        long winnerGain = winner.getBounty() - 50_000_000L;
        long loserLoss = 10_000_000L - loser.getBounty();
        assertThat(loserLoss).isLessThanOrEqualTo(winnerGain * 3 / 10 + 1); // +1 for rounding
    }

    @Test
    void updateBounties_underdogWins_massiveGain() {
        User underdog = buildUser("Luffy", Filiation.PIRATE, 50_000_000L);
        User favorite = buildUser("Kaido", Filiation.PIRATE, 1_500_000_000L);

        bountyService.updateBounties(underdog, favorite);

        // Underdog (low K*2) beating emperor: huge gain
        assertThat(underdog.getBounty()).isGreaterThan(300_000_000L);
    }

    @Test
    void updateBounties_favoriteWins_smallGain() {
        User favorite = buildUser("Kaido", Filiation.PIRATE, 1_500_000_000L);
        User underdog = buildUser("Luffy", Filiation.PIRATE, 50_000_000L);

        bountyService.updateBounties(favorite, underdog);

        // Emperor (K*0.8) beating rookie: minimum gain of 5M
        assertThat(favorite.getBounty()).isGreaterThanOrEqualTo(1_505_000_000L);
    }

    @Test
    void updateBounties_bountyFloor_cannotGoBelowMinimum() {
        User winner = buildUser("Luffy", Filiation.PIRATE, 50_000_000L);
        User loser = buildUser("Buggy", Filiation.PIRATE, 1_000_000L);

        bountyService.updateBounties(winner, loser);

        assertThat(loser.getBounty()).isGreaterThanOrEqualTo(1_000_000L);
    }

    @Test
    void updateBounties_rankPromotion_crossesSupernova() {
        // Winner at 95M, should cross 100M → SUPERNOVA
        User winner = buildUser("Zoro", Filiation.PIRATE, 95_000_000L);
        User loser = buildUser("Akainu", Filiation.MARINE, 95_000_000L);

        bountyService.updateBounties(winner, loser);

        assertThat(winner.getBounty()).isGreaterThanOrEqualTo(100_000_000L);
        assertThat(winner.getRank()).isEqualTo("SUPERNOVA");
    }

    @Test
    void updateBounties_rankDemotion_dropsBelowSuperRookie() {
        // Loser at 51M might drop below 50M → ROOKIE
        User winner = buildUser("Akainu", Filiation.MARINE, 200_000_000L);
        User loser = buildUser("Buggy", Filiation.PIRATE, 51_000_000L);

        bountyService.updateBounties(winner, loser);

        if (loser.getBounty() < 50_000_000L) {
            assertThat(loser.getRank()).isEqualTo("ROOKIE");
        }
    }

    @Test
    void updateBounties_marineRankPromotion() {
        User winner = buildUser("Garp", Filiation.MARINE, 95_000_000L);
        User loser = buildUser("Luffy", Filiation.PIRATE, 95_000_000L);

        bountyService.updateBounties(winner, loser);

        assertThat(winner.getBounty()).isGreaterThanOrEqualTo(100_000_000L);
        assertThat(winner.getRank()).isEqualTo("COMMODORE");
    }

    @Test
    void computeRank_pirateThresholds() {
        assertThat(BountyService.computeRank(1_000_000L, Filiation.PIRATE)).isEqualTo("ROOKIE");
        assertThat(BountyService.computeRank(49_999_999L, Filiation.PIRATE)).isEqualTo("ROOKIE");
        assertThat(BountyService.computeRank(50_000_000L, Filiation.PIRATE)).isEqualTo("SUPER_ROOKIE");
        assertThat(BountyService.computeRank(99_999_999L, Filiation.PIRATE)).isEqualTo("SUPER_ROOKIE");
        assertThat(BountyService.computeRank(100_000_000L, Filiation.PIRATE)).isEqualTo("SUPERNOVA");
        assertThat(BountyService.computeRank(499_999_999L, Filiation.PIRATE)).isEqualTo("SUPERNOVA");
        assertThat(BountyService.computeRank(500_000_000L, Filiation.PIRATE)).isEqualTo("SHICHIBUKAI");
        assertThat(BountyService.computeRank(1_499_999_999L, Filiation.PIRATE)).isEqualTo("SHICHIBUKAI");
        assertThat(BountyService.computeRank(1_500_000_000L, Filiation.PIRATE)).isEqualTo("YONKO");
        assertThat(BountyService.computeRank(2_999_999_999L, Filiation.PIRATE)).isEqualTo("YONKO");
        assertThat(BountyService.computeRank(3_000_000_000L, Filiation.PIRATE)).isEqualTo("PIRATE_KING");
    }

    @Test
    void computeRank_marineThresholds() {
        assertThat(BountyService.computeRank(1_000_000L, Filiation.MARINE)).isEqualTo("SEAMAN");
        assertThat(BountyService.computeRank(49_999_999L, Filiation.MARINE)).isEqualTo("SEAMAN");
        assertThat(BountyService.computeRank(50_000_000L, Filiation.MARINE)).isEqualTo("CAPTAIN");
        assertThat(BountyService.computeRank(99_999_999L, Filiation.MARINE)).isEqualTo("CAPTAIN");
        assertThat(BountyService.computeRank(100_000_000L, Filiation.MARINE)).isEqualTo("COMMODORE");
        assertThat(BountyService.computeRank(499_999_999L, Filiation.MARINE)).isEqualTo("COMMODORE");
        assertThat(BountyService.computeRank(500_000_000L, Filiation.MARINE)).isEqualTo("VICE_ADMIRAL");
        assertThat(BountyService.computeRank(1_499_999_999L, Filiation.MARINE)).isEqualTo("VICE_ADMIRAL");
        assertThat(BountyService.computeRank(1_500_000_000L, Filiation.MARINE)).isEqualTo("ADMIRAL");
        assertThat(BountyService.computeRank(2_999_999_999L, Filiation.MARINE)).isEqualTo("ADMIRAL");
        assertThat(BountyService.computeRank(3_000_000_000L, Filiation.MARINE)).isEqualTo("FLEET_ADMIRAL");
    }

    @Test
    void updateBounties_winnerAlwaysGainsMinimum() {
        // Even a massive favorite wins at least 5M
        User favorite = buildUser("Roger", Filiation.PIRATE, 5_000_000_000L);
        User underdog = buildUser("Fodder", Filiation.PIRATE, 1_000_000L);

        bountyService.updateBounties(favorite, underdog);

        assertThat(favorite.getBounty()).isGreaterThanOrEqualTo(5_005_000_000L);
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
