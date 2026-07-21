package com.last_island.api.domain.user.service;

import com.last_island.api.domain.user.dto.LeaderboardEntryResponse;
import com.last_island.api.domain.user.dto.LeaderboardResponse;
import com.last_island.api.domain.user.entity.User;
import com.last_island.api.domain.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class LeaderboardService {

    private final UserRepository userRepository;

    public LeaderboardService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public LeaderboardResponse getLeaderboard(UUID currentUserId) {
        List<User> top10 = userRepository.findTop10ByOrderByBountyDesc();

        boolean currentUserInTop10 = false;
        List<LeaderboardEntryResponse> entries = new java.util.ArrayList<>();

        for (int i = 0; i < top10.size(); i++) {
            User user = top10.get(i);
            boolean isCurrent = user.getId().equals(currentUserId);
            if (isCurrent) {
                currentUserInTop10 = true;
            }
            entries.add(new LeaderboardEntryResponse(
                    i + 1,
                    user.getName(),
                    user.getWins(),
                    user.getLosses(),
                    user.getWinRate(),
                    user.getRank(),
                    user.getBounty(),
                    isCurrent,
                    user.getAvatar() != null ? user.getAvatar().name() : null
            ));
        }

        LeaderboardEntryResponse currentUserEntry = null;
        if (!currentUserInTop10) {
            currentUserEntry = buildCurrentUserEntry(currentUserId);
        }

        return new LeaderboardResponse(entries, currentUserEntry);
    }

    private LeaderboardEntryResponse buildCurrentUserEntry(UUID currentUserId) {
        return userRepository.findById(currentUserId)
                .map(user -> {
                    double userBounty = (double) user.getBounty();
                    long ahead = userRepository.countUsersAhead(userBounty, user.getName());
                    int position = (int) (ahead + 1);
                    return new LeaderboardEntryResponse(
                            position,
                            user.getName(),
                            user.getWins(),
                            user.getLosses(),
                            user.getWinRate(),
                            user.getRank(),
                            user.getBounty(),
                            true,
                            user.getAvatar() != null ? user.getAvatar().name() : null
                    );
                })
                .orElse(null);
    }
}
