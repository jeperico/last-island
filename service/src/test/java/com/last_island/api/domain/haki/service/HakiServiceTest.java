package com.last_island.api.domain.haki.service;

import com.last_island.api.domain.haki.dto.HakiProfileResponse;
import com.last_island.api.domain.haki.entity.HakiProfile;
import com.last_island.api.domain.haki.enums.HakiType;
import com.last_island.api.domain.haki.repository.HakiProfileRepository;
import com.last_island.api.domain.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HakiServiceTest {

    @Mock
    private HakiProfileRepository hakiProfileRepository;

    private HakiService hakiService;

    @BeforeEach
    void setUp() {
        hakiService = new HakiService(hakiProfileRepository);
    }

    @Test
    void createProfile_createsWithZeroValues() {
        UUID userId = UUID.randomUUID();

        hakiService.createProfile(userId);

        ArgumentCaptor<HakiProfile> captor = ArgumentCaptor.forClass(HakiProfile.class);
        verify(hakiProfileRepository).save(captor.capture());

        HakiProfile saved = captor.getValue();
        assertThat(saved.getUserId()).isEqualTo(userId);
        assertThat(saved.getHakiPoints()).isZero();
        assertThat(saved.getHakiPointsAvailable()).isZero();
        assertThat(saved.getObservationLevel()).isZero();
        assertThat(saved.getArmamentLevel()).isZero();
        assertThat(saved.getConquerorsLevel()).isZero();
        assertThat(saved.getBountyMilestonesReached()).isZero();
    }

    @Test
    void getProfile_existingUser_returnsResponse() {
        UUID userId = UUID.randomUUID();
        HakiProfile profile = buildProfile(userId, 5, 3, 1, 2, 0, 2);
        when(hakiProfileRepository.findByUserId(userId)).thenReturn(Optional.of(profile));

        HakiProfileResponse response = hakiService.getProfile(userId);

        assertThat(response.hakiPoints()).isEqualTo(5);
        assertThat(response.hakiPointsAvailable()).isEqualTo(3);
        assertThat(response.observationLevel()).isEqualTo(1);
        assertThat(response.armamentLevel()).isEqualTo(2);
        assertThat(response.conquerorsLevel()).isEqualTo(0);
        assertThat(response.bountyMilestonesReached()).isEqualTo(2);
    }

    @Test
    void getProfile_unknownUser_throws404() {
        UUID userId = UUID.randomUUID();
        when(hakiProfileRepository.findByUserId(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> hakiService.getProfile(userId))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404");
    }

    @Test
    void awardPointForWin_firstWin_awardsOnePoint() {
        User winner = buildUser(1);
        HakiProfile profile = buildProfile(winner.getId(), 0, 0, 0, 0, 0, 0);
        when(hakiProfileRepository.findByUserId(winner.getId())).thenReturn(Optional.of(profile));

        hakiService.awardPointForWin(winner);

        assertThat(profile.getHakiPoints()).isEqualTo(1);
        assertThat(profile.getHakiPointsAvailable()).isEqualTo(1);
        verify(hakiProfileRepository).save(profile);
    }

    @Test
    void awardPointForWin_secondWin_awardsOnePoint() {
        User winner = buildUser(2);
        HakiProfile profile = buildProfile(winner.getId(), 1, 1, 0, 0, 0, 0);
        when(hakiProfileRepository.findByUserId(winner.getId())).thenReturn(Optional.of(profile));

        hakiService.awardPointForWin(winner);

        assertThat(profile.getHakiPoints()).isEqualTo(2);
        assertThat(profile.getHakiPointsAvailable()).isEqualTo(2);
        verify(hakiProfileRepository).save(profile);
    }

    @Test
    void awardPointForWin_thirdWin_awardsOnePoint() {
        User winner = buildUser(3);
        HakiProfile profile = buildProfile(winner.getId(), 2, 2, 0, 0, 0, 0);
        when(hakiProfileRepository.findByUserId(winner.getId())).thenReturn(Optional.of(profile));

        hakiService.awardPointForWin(winner);

        assertThat(profile.getHakiPoints()).isEqualTo(3);
        assertThat(profile.getHakiPointsAvailable()).isEqualTo(3);
        verify(hakiProfileRepository).save(profile);
    }

    @Test
    void awardPointForWin_fourthWin_doesNotAward() {
        User winner = buildUser(4);

        hakiService.awardPointForWin(winner);

        verify(hakiProfileRepository, never()).findByUserId(any());
        verify(hakiProfileRepository, never()).save(any());
    }

    @Test
    void checkBountyMilestones_crossesFirstThreshold_awardsOnePoint() {
        User winner = buildUser(1);
        HakiProfile profile = buildProfile(winner.getId(), 0, 0, 0, 0, 0, 0);
        when(hakiProfileRepository.findByUserId(winner.getId())).thenReturn(Optional.of(profile));

        hakiService.checkBountyMilestones(winner, 300_000_000L);

        assertThat(profile.getHakiPoints()).isEqualTo(1);
        assertThat(profile.getHakiPointsAvailable()).isEqualTo(1);
        assertThat(profile.getBountyMilestonesReached()).isEqualTo(1);
        verify(hakiProfileRepository).save(profile);
    }

    @Test
    void checkBountyMilestones_crossesMultipleThresholds_awardsMultiplePoints() {
        User winner = buildUser(1);
        HakiProfile profile = buildProfile(winner.getId(), 0, 0, 0, 0, 0, 0);
        when(hakiProfileRepository.findByUserId(winner.getId())).thenReturn(Optional.of(profile));

        hakiService.checkBountyMilestones(winner, 700_000_000L);

        assertThat(profile.getHakiPoints()).isEqualTo(3);
        assertThat(profile.getHakiPointsAvailable()).isEqualTo(3);
        assertThat(profile.getBountyMilestonesReached()).isEqualTo(3);
        verify(hakiProfileRepository).save(profile);
    }

    @Test
    void checkBountyMilestones_alreadyReached_noChange() {
        User winner = buildUser(1);
        HakiProfile profile = buildProfile(winner.getId(), 1, 1, 0, 0, 0, 1);
        when(hakiProfileRepository.findByUserId(winner.getId())).thenReturn(Optional.of(profile));

        hakiService.checkBountyMilestones(winner, 300_000_000L);

        assertThat(profile.getHakiPoints()).isEqualTo(1);
        assertThat(profile.getHakiPointsAvailable()).isEqualTo(1);
        assertThat(profile.getBountyMilestonesReached()).isEqualTo(1);
        verify(hakiProfileRepository, never()).save(any());
    }

    @Test
    void checkBountyMilestones_bountyDropsBelowThreshold_noPointRemoval() {
        User winner = buildUser(1);
        HakiProfile profile = buildProfile(winner.getId(), 1, 1, 0, 0, 0, 1);
        when(hakiProfileRepository.findByUserId(winner.getId())).thenReturn(Optional.of(profile));

        hakiService.checkBountyMilestones(winner, 200_000_000L);

        assertThat(profile.getHakiPoints()).isEqualTo(1);
        assertThat(profile.getHakiPointsAvailable()).isEqualTo(1);
        assertThat(profile.getBountyMilestonesReached()).isEqualTo(1);
        verify(hakiProfileRepository, never()).save(any());
    }

    @Test
    void spendPoints_observationLv1_success() {
        UUID userId = UUID.randomUUID();
        HakiProfile profile = buildProfile(userId, 1, 1, 0, 0, 0, 0);
        when(hakiProfileRepository.findByUserId(userId)).thenReturn(Optional.of(profile));
        when(hakiProfileRepository.save(any())).thenReturn(profile);

        HakiProfileResponse response = hakiService.spendPoints(userId, HakiType.OBSERVATION, 1);

        assertThat(profile.getObservationLevel()).isEqualTo(1);
        assertThat(profile.getHakiPointsAvailable()).isZero();
        verify(hakiProfileRepository).save(profile);
    }

    @Test
    void spendPoints_observationLv3_costs2() {
        UUID userId = UUID.randomUUID();
        HakiProfile profile = buildProfile(userId, 4, 2, 2, 0, 0, 0);
        when(hakiProfileRepository.findByUserId(userId)).thenReturn(Optional.of(profile));
        when(hakiProfileRepository.save(any())).thenReturn(profile);

        HakiProfileResponse response = hakiService.spendPoints(userId, HakiType.OBSERVATION, 3);

        assertThat(profile.getObservationLevel()).isEqualTo(3);
        assertThat(profile.getHakiPointsAvailable()).isZero();
        verify(hakiProfileRepository).save(profile);
    }

    @Test
    void spendPoints_insufficientPoints_throwsBadRequest() {
        UUID userId = UUID.randomUUID();
        HakiProfile profile = buildProfile(userId, 0, 0, 0, 0, 0, 0);
        when(hakiProfileRepository.findByUserId(userId)).thenReturn(Optional.of(profile));

        assertThatThrownBy(() -> hakiService.spendPoints(userId, HakiType.OBSERVATION, 1))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Insufficient haki points");
    }

    @Test
    void spendPoints_wrongLevel_throwsBadRequest() {
        UUID userId = UUID.randomUUID();
        HakiProfile profile = buildProfile(userId, 5, 5, 0, 0, 0, 0);
        when(hakiProfileRepository.findByUserId(userId)).thenReturn(Optional.of(profile));

        assertThatThrownBy(() -> hakiService.spendPoints(userId, HakiType.OBSERVATION, 2))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Must upgrade sequentially");
    }

    @Test
    void spendPoints_conquerorsLv1_withPrerequisitesMet_success() {
        UUID userId = UUID.randomUUID();
        HakiProfile profile = buildProfile(userId, 10, 3, 1, 3, 0, 0);
        when(hakiProfileRepository.findByUserId(userId)).thenReturn(Optional.of(profile));
        when(hakiProfileRepository.save(any())).thenReturn(profile);

        HakiProfileResponse response = hakiService.spendPoints(userId, HakiType.CONQUERORS, 1);

        assertThat(profile.getConquerorsLevel()).isEqualTo(1);
        assertThat(profile.getHakiPointsAvailable()).isZero();
        verify(hakiProfileRepository).save(profile);
    }

    @Test
    void spendPoints_conquerorsLv1_withoutAwakening_throwsBadRequest() {
        UUID userId = UUID.randomUUID();
        HakiProfile profile = buildProfile(userId, 10, 3, 1, 1, 0, 0);
        when(hakiProfileRepository.findByUserId(userId)).thenReturn(Optional.of(profile));

        assertThatThrownBy(() -> hakiService.spendPoints(userId, HakiType.CONQUERORS, 1))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Conqueror's Haki requires");
    }

    @Test
    void spendPoints_conquerorsLv1_withoutObservation_throwsBadRequest() {
        UUID userId = UUID.randomUUID();
        HakiProfile profile = buildProfile(userId, 10, 3, 0, 3, 0, 0);
        when(hakiProfileRepository.findByUserId(userId)).thenReturn(Optional.of(profile));

        assertThatThrownBy(() -> hakiService.spendPoints(userId, HakiType.CONQUERORS, 1))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Conqueror's Haki requires");
    }

    private User buildUser(int wins) {
        User user = User.builder()
                .name("TestUser")
                .bounty(100_000_000L)
                .rank("SUPER_ROOKIE")
                .wins(wins)
                .losses(0)
                .totalShots(0)
                .totalHits(0)
                .build();
        user.setId(UUID.randomUUID());
        return user;
    }

    private HakiProfile buildProfile(UUID userId, int hakiPoints, int hakiPointsAvailable,
                                     int obsLevel, int armLevel, int conqLevel, int milestones) {
        return HakiProfile.builder()
                .userId(userId)
                .hakiPoints(hakiPoints)
                .hakiPointsAvailable(hakiPointsAvailable)
                .observationLevel(obsLevel)
                .armamentLevel(armLevel)
                .conquerorsLevel(conqLevel)
                .bountyMilestonesReached(milestones)
                .build();
    }
}
