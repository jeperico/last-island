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
    void updateBounties_equalMatch_winnerGains50M() {
        User winner = buildUser("Luffy", Filiation.PIRATE, 100_000_000L);
        User loser = buildUser("Akainu", Filiation.MARINE, 100_000_000L);

        bountyService.updateBounties(winner, loser);

        assertThat(winner.getBounty()).isEqualTo(150_000_000L);
        assertThat(loser.getBounty()).isEqualTo(50_000_000L);
    }

    @Test
    void updateBounties_underdogWins_gainsDouble() {
        // ratio = 50/200 = 0.25 < 0.5 → gain 2x (100M), loss 25M
        User underdog = buildUser("Luffy", Filiation.PIRATE, 50_000_000L);
        User favorite = buildUser("Kaido", Filiation.PIRATE, 200_000_000L);

        bountyService.updateBounties(underdog, favorite);

        assertThat(underdog.getBounty()).isEqualTo(150_000_000L); // +100M
        assertThat(favorite.getBounty()).isEqualTo(175_000_000L); // -25M
    }

    @Test
    void updateBounties_favoriteWins_gainsLess() {
        // ratio = 200/50 = 4.0 > 2.0 → gain 0.5x (25M), loss 100M
        User favorite = buildUser("Kaido", Filiation.PIRATE, 200_000_000L);
        User underdog = buildUser("Luffy", Filiation.PIRATE, 50_000_000L);

        bountyService.updateBounties(favorite, underdog);

        assertThat(favorite.getBounty()).isEqualTo(225_000_000L); // +25M
        assertThat(underdog.getBounty()).isEqualTo(0L); // 50M - 100M → floor at 0
    }

    @Test
    void updateBounties_bountyFloor_cannotGoBelowZero() {
        User winner = buildUser("Luffy", Filiation.PIRATE, 100_000_000L);
        User loser = buildUser("Buggy", Filiation.PIRATE, 10_000_000L);

        bountyService.updateBounties(winner, loser);

        assertThat(loser.getBounty()).isGreaterThanOrEqualTo(0L);
    }

    @Test
    void updateBounties_rankPromotion_crossesSupernova() {
        // Winner at 160M (SUPER_ROOKIE), wins equal match → 210M (SUPERNOVA)
        User winner = buildUser("Zoro", Filiation.PIRATE, 160_000_000L);
        User loser = buildUser("Sanji", Filiation.PIRATE, 160_000_000L);

        bountyService.updateBounties(winner, loser);

        assertThat(winner.getBounty()).isEqualTo(210_000_000L);
        assertThat(winner.getRank()).isEqualTo("SUPERNOVA");
    }

    @Test
    void updateBounties_rankDemotion_dropsBelowSuperRookie() {
        // Loser at 100M (SUPER_ROOKIE), loses equal match → 50M (ROOKIE)
        User winner = buildUser("Akainu", Filiation.MARINE, 100_000_000L);
        User loser = buildUser("Buggy", Filiation.PIRATE, 100_000_000L);

        bountyService.updateBounties(winner, loser);

        assertThat(loser.getBounty()).isEqualTo(50_000_000L);
        assertThat(loser.getRank()).isEqualTo("ROOKIE");
    }

    @Test
    void updateBounties_marineRankPromotion() {
        User winner = buildUser("Garp", Filiation.MARINE, 160_000_000L);
        User loser = buildUser("Luffy", Filiation.PIRATE, 160_000_000L);

        bountyService.updateBounties(winner, loser);

        assertThat(winner.getBounty()).isEqualTo(210_000_000L);
        assertThat(winner.getRank()).isEqualTo("COMMODORE");
    }

    @Test
    void computeRank_pirateThresholds() {
        assertThat(BountyService.computeRank(0L, Filiation.PIRATE)).isEqualTo("ROOKIE");
        assertThat(BountyService.computeRank(99_999_999L, Filiation.PIRATE)).isEqualTo("ROOKIE");
        assertThat(BountyService.computeRank(100_000_000L, Filiation.PIRATE)).isEqualTo("SUPER_ROOKIE");
        assertThat(BountyService.computeRank(199_999_999L, Filiation.PIRATE)).isEqualTo("SUPER_ROOKIE");
        assertThat(BountyService.computeRank(200_000_000L, Filiation.PIRATE)).isEqualTo("SUPERNOVA");
        assertThat(BountyService.computeRank(399_999_999L, Filiation.PIRATE)).isEqualTo("SUPERNOVA");
        assertThat(BountyService.computeRank(400_000_000L, Filiation.PIRATE)).isEqualTo("SHICHIBUKAI");
        assertThat(BountyService.computeRank(799_999_999L, Filiation.PIRATE)).isEqualTo("SHICHIBUKAI");
        assertThat(BountyService.computeRank(800_000_000L, Filiation.PIRATE)).isEqualTo("YONKO");
        assertThat(BountyService.computeRank(1_499_999_999L, Filiation.PIRATE)).isEqualTo("YONKO");
        assertThat(BountyService.computeRank(1_500_000_000L, Filiation.PIRATE)).isEqualTo("PIRATE_KING");
    }

    @Test
    void computeRank_marineThresholds() {
        assertThat(BountyService.computeRank(0L, Filiation.MARINE)).isEqualTo("SEAMAN");
        assertThat(BountyService.computeRank(99_999_999L, Filiation.MARINE)).isEqualTo("SEAMAN");
        assertThat(BountyService.computeRank(100_000_000L, Filiation.MARINE)).isEqualTo("CAPTAIN");
        assertThat(BountyService.computeRank(199_999_999L, Filiation.MARINE)).isEqualTo("CAPTAIN");
        assertThat(BountyService.computeRank(200_000_000L, Filiation.MARINE)).isEqualTo("COMMODORE");
        assertThat(BountyService.computeRank(399_999_999L, Filiation.MARINE)).isEqualTo("COMMODORE");
        assertThat(BountyService.computeRank(400_000_000L, Filiation.MARINE)).isEqualTo("VICE_ADMIRAL");
        assertThat(BountyService.computeRank(799_999_999L, Filiation.MARINE)).isEqualTo("VICE_ADMIRAL");
        assertThat(BountyService.computeRank(800_000_000L, Filiation.MARINE)).isEqualTo("ADMIRAL");
        assertThat(BountyService.computeRank(1_499_999_999L, Filiation.MARINE)).isEqualTo("ADMIRAL");
        assertThat(BountyService.computeRank(1_500_000_000L, Filiation.MARINE)).isEqualTo("FLEET_ADMIRAL");
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
