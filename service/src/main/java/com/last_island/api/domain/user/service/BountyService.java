package com.last_island.api.domain.user.service;

import com.last_island.api.domain.user.entity.User;
import com.last_island.api.domain.user.enums.Filiation;
import org.springframework.stereotype.Service;

@Service
public class BountyService {

    public static final int K_FACTOR = 160;
    public static final long STARTING_BOUNTY = 1000;
    public static final long BOUNTY_FLOOR = 0;

    /**
     * Updates bounties for winner and loser using Elo K-factor formula.
     * Sets new bounty values and derives new ranks on both User entities.
     */
    public void updateBounties(User winner, User loser) {
        double winnerExpected = expectedScore(winner.getBounty(), loser.getBounty());
        double loserExpected = expectedScore(loser.getBounty(), winner.getBounty());

        long newWinnerBounty = Math.max(BOUNTY_FLOOR,
                winner.getBounty() + Math.round(K_FACTOR * (1.0 - winnerExpected)));
        long newLoserBounty = Math.max(BOUNTY_FLOOR,
                loser.getBounty() + Math.round(K_FACTOR * (0.0 - loserExpected)));

        winner.setBounty(newWinnerBounty);
        loser.setBounty(newLoserBounty);

        winner.setRank(computeRank(newWinnerBounty, winner.getFiliation()));
        loser.setRank(computeRank(newLoserBounty, loser.getFiliation()));
    }

    /**
     * Derives rank from bounty and filiation.
     * Thresholds:
     *   0-999:    ROOKIE / SEAMAN
     *   1000-1499: SUPER_ROOKIE / CAPTAIN
     *   1500-1999: SUPERNOVA / COMMODORE
     *   2000-2499: SHICHIBUKAI / VICE_ADMIRAL
     *   2500-2999: YONKO / ADMIRAL
     *   3000+:    PIRATE_KING / FLEET_ADMIRAL
     */
    public static String computeRank(long bounty, Filiation filiation) {
        if (filiation == Filiation.PIRATE) {
            if (bounty >= 3000) return "PIRATE_KING";
            if (bounty >= 2500) return "YONKO";
            if (bounty >= 2000) return "SHICHIBUKAI";
            if (bounty >= 1500) return "SUPERNOVA";
            if (bounty >= 1000) return "SUPER_ROOKIE";
            return "ROOKIE";
        } else {
            if (bounty >= 3000) return "FLEET_ADMIRAL";
            if (bounty >= 2500) return "ADMIRAL";
            if (bounty >= 2000) return "VICE_ADMIRAL";
            if (bounty >= 1500) return "COMMODORE";
            if (bounty >= 1000) return "CAPTAIN";
            return "SEAMAN";
        }
    }

    private double expectedScore(long ratingA, long ratingB) {
        return 1.0 / (1.0 + Math.pow(10.0, (ratingB - ratingA) / 400.0));
    }
}
