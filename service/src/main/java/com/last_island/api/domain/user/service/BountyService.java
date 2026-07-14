package com.last_island.api.domain.user.service;

import com.last_island.api.domain.user.entity.User;
import com.last_island.api.domain.user.enums.Filiation;
import org.springframework.stereotype.Service;

@Service
public class BountyService {

    // Base K-factor in bounty scale (millions)
    public static final long BASE_K = 160_000_000L; // 160M base swing
    public static final long STARTING_BOUNTY = 50_000_000L; // 50M — East Blue rookie
    public static final long BOUNTY_FLOOR = 1_000_000L;     // 1M minimum (can't go below)
    public static final long MIN_GAIN = 5_000_000L;         // 5M minimum win reward

    /**
     * Updates bounties for winner and loser using modified Elo formula.
     * Low-bounty players gain more and lose less (protection + fast climb).
     */
    public void updateBounties(User winner, User loser) {
        double winnerExpected = expectedScore(winner.getBounty(), loser.getBounty());
        double loserExpected = expectedScore(loser.getBounty(), winner.getBounty());

        // Dynamic K: low-bounty players get higher K (climb faster)
        double winnerK = effectiveK(winner.getBounty());
        double loserK = effectiveK(loser.getBounty());

        // Winner always gains at least a minimum amount
        long winnerGain = Math.max(MIN_GAIN, Math.round(winnerK * (1.0 - winnerExpected)));
        long loserLoss = Math.round(loserK * loserExpected);

        // Low-bounty protection: lose at most 30% of what winner gains
        if (loser.getBounty() < 100_000_000L) {
            loserLoss = Math.min(loserLoss, winnerGain * 3 / 10);
        }

        long newWinnerBounty = winner.getBounty() + winnerGain;
        long newLoserBounty = Math.max(BOUNTY_FLOOR, loser.getBounty() - loserLoss);

        winner.setBounty(newWinnerBounty);
        loser.setBounty(newLoserBounty);

        winner.setRank(computeRank(newWinnerBounty, winner.getFiliation()));
        loser.setRank(computeRank(newLoserBounty, loser.getFiliation()));
    }

    /**
     * Dynamic K-factor: lower bounty = higher K = faster climb.
     * - Below 100M: K × 2.0 (rookies climb fast)
     * - 100M-500M: K × 1.5 (still accelerated)
     * - 500M-1.5B: K × 1.0 (standard)
     * - Above 1.5B: K × 0.8 (emperors are stable)
     */
    private double effectiveK(long bounty) {
        if (bounty < 100_000_000L) return BASE_K * 2.0;
        if (bounty < 500_000_000L) return BASE_K * 1.5;
        if (bounty < 1_500_000_000L) return BASE_K * 1.0;
        return BASE_K * 0.8;
    }

    /**
     * Derives rank from bounty and filiation.
     * Based on real One Piece bounty/rank equivalents:
     *
     * Pirates:
     *   1M-49M:      ROOKIE         (East Blue fodder — Buggy 15M, Arlong 20M)
     *   50M-99M:     SUPER_ROOKIE   (Paradise entry — Bellamy 55M, Robin 79M)
     *   100M-499M:   SUPERNOVA      (Worst Generation — Luffy 300M, Kid 315M)
     *   500M-1.49B:  SHICHIBUKAI    (Warlord tier — Doflamingo 340M*, Ace 550M)
     *   1.5B-2.99B:  YONKO          (Emperor tier — Luffy 1.5B, Blackbeard 2.2B)
     *   3B+:         PIRATE_KING    (Roger 5.5B, Whitebeard 5B)
     *
     * Marines:
     *   1M-49M:      SEAMAN         (Seaman recruit)
     *   50M-99M:     CAPTAIN        (Marine Captain — Smoker pre-TS)
     *   100M-499M:   COMMODORE      (Commodore)
     *   500M-1.49B:  VICE_ADMIRAL   (Vice Admiral — Garp equivalent)
     *   1.5B-2.99B:  ADMIRAL        (Admiral — Akainu, Aokiji, Kizaru)
     *   3B+:         FLEET_ADMIRAL  (Fleet Admiral — Sengoku, Akainu)
     */
    public static String computeRank(long bounty, Filiation filiation) {
        if (filiation == Filiation.PIRATE) {
            if (bounty >= 3_000_000_000L) return "PIRATE_KING";
            if (bounty >= 1_500_000_000L) return "YONKO";
            if (bounty >= 500_000_000L) return "SHICHIBUKAI";
            if (bounty >= 100_000_000L) return "SUPERNOVA";
            if (bounty >= 50_000_000L) return "SUPER_ROOKIE";
            return "ROOKIE";
        } else {
            if (bounty >= 3_000_000_000L) return "FLEET_ADMIRAL";
            if (bounty >= 1_500_000_000L) return "ADMIRAL";
            if (bounty >= 500_000_000L) return "VICE_ADMIRAL";
            if (bounty >= 100_000_000L) return "COMMODORE";
            if (bounty >= 50_000_000L) return "CAPTAIN";
            return "SEAMAN";
        }
    }

    private double expectedScore(long ratingA, long ratingB) {
        // Scale the difference for the larger bounty numbers
        // 400M difference = same weight as 400 in chess Elo
        double diff = (ratingB - ratingA) / 1_000_000.0;
        return 1.0 / (1.0 + Math.pow(10.0, diff / 400.0));
    }
}
