package com.last_island.api.domain.user.service;

import com.last_island.api.domain.user.entity.User;
import org.springframework.stereotype.Service;

@Service
public class BountyService {

    public static final long STARTING_BOUNTY = 100_000_000L;  // 100M — Super Rookie
    public static final long BOUNTY_FLOOR = 0L;

    /**
     * Updates bounties for winner and loser.
     * Flat gain/loss system with underdog bonus for simpler, more predictable progression.
     *
     * Target progression (for equal-skill opponents):
     *   Start (0W): 100M → SUPER_ROOKIE
     *   ~2 wins:    200M → SUPERNOVA
     *   ~4 wins:    400M → SHICHIBUKAI
     *   ~8 wins:    800M → YONKO
     *   ~15 wins:  1500M → PIRATE_KING
     *   1 loss from start: drops below 100M → ROOKIE
     */
    public long updateBounties(User winner, User loser) {
        long baseGain = 50_000_000L; // 50M base per win

        // Underdog bonus: if winner has lower bounty, gain more
        double ratio = loser.getBounty() > 0
                ? (double) winner.getBounty() / loser.getBounty()
                : 0.5;

        long gain;
        long loss;

        if (ratio < 0.5) {
            // Big underdog wins: gain 2x
            gain = baseGain * 2;
            loss = baseGain / 2;
        } else if (ratio < 0.9) {
            // Slight underdog: gain 1.5x
            gain = baseGain * 3 / 2;
            loss = baseGain * 3 / 4;
        } else if (ratio < 1.1) {
            // Equal match
            gain = baseGain;
            loss = baseGain;
        } else if (ratio < 2.0) {
            // Slight favorite wins: gain 0.75x
            gain = baseGain * 3 / 4;
            loss = baseGain * 3 / 2;
        } else {
            // Big favorite wins: gain 0.5x
            gain = baseGain / 2;
            loss = baseGain * 2;
        }

        long newWinnerBounty = winner.getBounty() + gain;
        long newLoserBounty = Math.max(BOUNTY_FLOOR, loser.getBounty() - loss);

        winner.setBounty(newWinnerBounty);
        loser.setBounty(newLoserBounty);

        winner.setRank(computeRank(newWinnerBounty));
        loser.setRank(computeRank(newLoserBounty));

        return gain;
    }

    /**
     * Derives rank from bounty (pirate ranks only).
     *
     * Progression:
     *   0 - 99M:        ROOKIE
     *   100M - 199M:    SUPER_ROOKIE  (starting tier, 0-1 wins)
     *   200M - 399M:    SUPERNOVA     (~2 wins)
     *   400M - 799M:    SHICHIBUKAI   (~4 wins)
     *   800M - 1499M:   YONKO         (~8 wins)
     *   1500M+:         PIRATE_KING   (~15 wins)
     */
    public static String computeRank(long bounty) {
        if (bounty >= 1_500_000_000L) return "PIRATE_KING";
        if (bounty >= 800_000_000L) return "YONKO";
        if (bounty >= 400_000_000L) return "SHICHIBUKAI";
        if (bounty >= 200_000_000L) return "SUPERNOVA";
        if (bounty >= 100_000_000L) return "SUPER_ROOKIE";
        return "ROOKIE";
    }
}
