package com.last_island.api.domain.user.service;

import com.last_island.api.domain.user.dto.LeaderboardEntryResponse;
import com.last_island.api.domain.user.dto.LeaderboardResponse;
import com.last_island.api.domain.user.entity.User;
import com.last_island.api.domain.user.enums.Filiation;
import com.last_island.api.domain.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

@ExtendWith(MockitoExtension.class)
class LeaderboardServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private LeaderboardService leaderboardService;

    @Test
    void getLeaderboard_all_returnsTop10SortedByWins() {
        UUID currentUserId = UUID.randomUUID();
        User user1 = buildUser("Luffy", Filiation.PIRATE, 10);
        User user2 = buildUser("Zoro", Filiation.PIRATE, 8);
        User currentUser = buildUser("Sanji", Filiation.PIRATE, 6);
        currentUser.setId(currentUserId);

        when(userRepository.findTop10ByOrderByBountyDesc())
                .thenReturn(List.of(user1, user2, currentUser));

        LeaderboardResponse response = leaderboardService.getLeaderboard(currentUserId, "ALL");

        assertThat(response.entries()).hasSize(3);
        assertThat(response.entries().get(0).position()).isEqualTo(1);
        assertThat(response.entries().get(0).name()).isEqualTo("Luffy");
        assertThat(response.entries().get(0).wins()).isEqualTo(10);
        assertThat(response.entries().get(0).winRate()).isGreaterThan(0.0);
        assertThat(response.entries().get(0).bounty()).isEqualTo(10000L);
        assertThat(response.entries().get(1).position()).isEqualTo(2);
        assertThat(response.entries().get(2).position()).isEqualTo(3);

        verify(userRepository).findTop10ByOrderByBountyDesc();
        verify(userRepository, never()).findTop10ByFiliationOrderByBountyDesc(any());
    }

    @Test
    void getLeaderboard_pirate_filtersOnlyPirates() {
        UUID currentUserId = UUID.randomUUID();
        User user1 = buildUser("Luffy", Filiation.PIRATE, 10);
        user1.setId(currentUserId);

        when(userRepository.findTop10ByFiliationOrderByBountyDesc(Filiation.PIRATE))
                .thenReturn(List.of(user1));

        LeaderboardResponse response = leaderboardService.getLeaderboard(currentUserId, "PIRATE");

        assertThat(response.entries()).hasSize(1);
        assertThat(response.entries().get(0).filiation()).isEqualTo("PIRATE");

        verify(userRepository).findTop10ByFiliationOrderByBountyDesc(Filiation.PIRATE);
        verify(userRepository, never()).findTop10ByOrderByBountyDesc();
    }

    @Test
    void getLeaderboard_currentUserInTop10_noCurrentUserEntry() {
        UUID currentUserId = UUID.randomUUID();
        User currentUser = buildUser("Luffy", Filiation.PIRATE, 10);
        currentUser.setId(currentUserId);

        when(userRepository.findTop10ByOrderByBountyDesc())
                .thenReturn(List.of(currentUser));

        LeaderboardResponse response = leaderboardService.getLeaderboard(currentUserId, "ALL");

        assertThat(response.currentUserEntry()).isNull();
        assertThat(response.entries().get(0).isCurrentUser()).isTrue();
    }

    @Test
    void getLeaderboard_currentUserNotInTop10_returnsCurrentUserEntry() {
        UUID currentUserId = UUID.randomUUID();
        User topUser = buildUser("Luffy", Filiation.PIRATE, 100);

        User currentUser = buildUser("Buggy", Filiation.PIRATE, 2);
        currentUser.setId(currentUserId);

        when(userRepository.findTop10ByOrderByBountyDesc())
                .thenReturn(List.of(topUser));
        when(userRepository.findById(currentUserId))
                .thenReturn(Optional.of(currentUser));
        when(userRepository.countUsersAhead(anyDouble(), eq("Buggy")))
                .thenReturn(15L);

        LeaderboardResponse response = leaderboardService.getLeaderboard(currentUserId, "ALL");

        assertThat(response.currentUserEntry()).isNotNull();
        assertThat(response.currentUserEntry().position()).isEqualTo(16);
        assertThat(response.currentUserEntry().name()).isEqualTo("Buggy");
        assertThat(response.currentUserEntry().wins()).isEqualTo(2);
        assertThat(response.currentUserEntry().bounty()).isEqualTo(2000L);
        assertThat(response.currentUserEntry().isCurrentUser()).isTrue();
    }

    // --- Helper methods ---

    private User buildUser(String name, Filiation filiation, int wins) {
        User user = User.builder()
                .name(name)
                .email(name.toLowerCase() + "@test.com")
                .passwordHash("hashed")
                .filiation(filiation)
                .rank("Rookie")
                .wins(wins)
                .losses(wins / 2)
                .bounty(wins * 1000L)
                .build();
        user.setId(UUID.randomUUID());
        return user;
    }
}
