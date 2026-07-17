package com.last_island.api.domain.haki.service;

import com.last_island.api.domain.haki.dto.HakiProfileResponse;
import com.last_island.api.domain.haki.entity.HakiProfile;
import com.last_island.api.domain.haki.enums.HakiType;
import com.last_island.api.domain.haki.repository.HakiProfileRepository;
import com.last_island.api.domain.user.entity.User;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class HakiService {

    private static final long[] BOUNTY_THRESHOLDS = {
        281_250_000L, 462_500_000L, 643_750_000L, 825_000_000L,
        1_006_250_000L, 1_187_500_000L, 1_368_750_000L, 1_550_000_000L,
        1_731_250_000L, 1_912_500_000L, 2_093_750_000L, 2_275_000_000L,
        2_456_250_000L, 2_637_500_000L, 2_818_750_000L, 3_000_000_000L
    };

    private static final int[] OBSERVATION_COSTS = {1, 1, 2};
    private static final int[] ARMAMENT_COSTS = {1, 1, 2};
    private static final int[] CONQUERORS_COSTS = {3, 3, 5};
    private static final int MAX_WIN_POINTS = 3;

    private final HakiProfileRepository hakiProfileRepository;

    public HakiService(HakiProfileRepository hakiProfileRepository) {
        this.hakiProfileRepository = hakiProfileRepository;
    }

    public void createProfile(UUID userId) {
        HakiProfile profile = HakiProfile.builder()
                .userId(userId)
                .hakiPoints(0)
                .hakiPointsAvailable(0)
                .observationLevel(0)
                .armamentLevel(0)
                .conquerorsLevel(0)
                .bountyMilestonesReached(0)
                .build();
        hakiProfileRepository.save(profile);
    }

    public HakiProfileResponse getProfile(UUID userId) {
        HakiProfile profile = hakiProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Haki profile not found"));
        return toResponse(profile);
    }

    public void awardPointForWin(User winner) {
        if (winner.getWins() <= MAX_WIN_POINTS) {
            HakiProfile profile = hakiProfileRepository.findByUserId(winner.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Haki profile not found"));
            profile.setHakiPoints(profile.getHakiPoints() + 1);
            profile.setHakiPointsAvailable(profile.getHakiPointsAvailable() + 1);
            hakiProfileRepository.save(profile);
        }
    }

    public void checkBountyMilestones(User winner, long newBounty) {
        HakiProfile profile = hakiProfileRepository.findByUserId(winner.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Haki profile not found"));

        int count = 0;
        for (long threshold : BOUNTY_THRESHOLDS) {
            if (newBounty >= threshold) {
                count++;
            } else {
                break;
            }
        }

        if (count > profile.getBountyMilestonesReached()) {
            int diff = count - profile.getBountyMilestonesReached();
            profile.setHakiPoints(profile.getHakiPoints() + diff);
            profile.setHakiPointsAvailable(profile.getHakiPointsAvailable() + diff);
            profile.setBountyMilestonesReached(count);
            hakiProfileRepository.save(profile);
        }
    }

    public HakiProfileResponse spendPoints(UUID userId, HakiType hakiType, int targetLevel) {
        HakiProfile profile = hakiProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Haki profile not found"));

        if (targetLevel < 1 || targetLevel > 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target level must be 1, 2, or 3");
        }

        int currentLevel = getCurrentLevel(profile, hakiType);
        if (currentLevel != targetLevel - 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Must upgrade sequentially");
        }

        int cost = getCost(hakiType, targetLevel);
        if (profile.getHakiPointsAvailable() < cost) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient haki points");
        }

        if (hakiType == HakiType.CONQUERORS && targetLevel == 1) {
            if (profile.getObservationLevel() < 1 || profile.getArmamentLevel() < 1
                    || (profile.getObservationLevel() < 3 && profile.getArmamentLevel() < 3)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Conqueror's Haki requires Observation >= 1, Armament >= 1, and at least one awakening (level 3)");
            }
        }

        profile.setHakiPointsAvailable(profile.getHakiPointsAvailable() - cost);
        setLevel(profile, hakiType, targetLevel);
        hakiProfileRepository.save(profile);

        return toResponse(profile);
    }

    private int getCurrentLevel(HakiProfile profile, HakiType hakiType) {
        return switch (hakiType) {
            case OBSERVATION -> profile.getObservationLevel();
            case ARMAMENT -> profile.getArmamentLevel();
            case CONQUERORS -> profile.getConquerorsLevel();
        };
    }

    private int getCost(HakiType hakiType, int targetLevel) {
        int[] costs = switch (hakiType) {
            case OBSERVATION -> OBSERVATION_COSTS;
            case ARMAMENT -> ARMAMENT_COSTS;
            case CONQUERORS -> CONQUERORS_COSTS;
        };
        return costs[targetLevel - 1];
    }

    private void setLevel(HakiProfile profile, HakiType hakiType, int level) {
        switch (hakiType) {
            case OBSERVATION -> profile.setObservationLevel(level);
            case ARMAMENT -> profile.setArmamentLevel(level);
            case CONQUERORS -> profile.setConquerorsLevel(level);
        }
    }

    private HakiProfileResponse toResponse(HakiProfile profile) {
        return new HakiProfileResponse(
                profile.getHakiPoints(),
                profile.getHakiPointsAvailable(),
                profile.getObservationLevel(),
                profile.getArmamentLevel(),
                profile.getConquerorsLevel(),
                profile.getBountyMilestonesReached()
        );
    }
}
