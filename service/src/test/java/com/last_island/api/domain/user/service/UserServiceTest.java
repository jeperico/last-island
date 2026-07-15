package com.last_island.api.domain.user.service;

import com.last_island.api.domain.user.dto.UpdateProfileRequest;
import com.last_island.api.domain.user.dto.UserResponse;
import com.last_island.api.domain.user.entity.User;
import com.last_island.api.domain.user.enums.Avatar;
import com.last_island.api.domain.user.enums.Filiation;
import com.last_island.api.domain.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @Test
    void updateProfile_pirateSetAvatar_success() {
        User user = buildUser(Filiation.PIRATE, null);
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateProfileRequest request = new UpdateProfileRequest(null, "LUFFY");
        UserResponse response = userService.updateProfile(user.getId(), request);

        assertThat(response.avatar()).isEqualTo("LUFFY");
        assertThat(user.getAvatar()).isEqualTo(Avatar.LUFFY);
        verify(userRepository).save(user);
    }

    @Test
    void updateProfile_marineSetAvatar_throwsBadRequest() {
        User user = buildUser(Filiation.MARINE, null);
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));

        UpdateProfileRequest request = new UpdateProfileRequest(null, "LUFFY");

        assertThatThrownBy(() -> userService.updateProfile(user.getId(), request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Marines cannot select an avatar");
    }

    @Test
    void updateProfile_switchToMarine_clearsAvatarAndUpdatesRank() {
        User user = buildUser(Filiation.PIRATE, Avatar.ZORO);
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateProfileRequest request = new UpdateProfileRequest(Filiation.MARINE, null);
        UserResponse response = userService.updateProfile(user.getId(), request);

        assertThat(response.avatar()).isNull();
        assertThat(response.filiation()).isEqualTo(Filiation.MARINE);
        assertThat(user.getAvatar()).isNull();
        assertThat(user.getFiliation()).isEqualTo(Filiation.MARINE);
        // Rank should be recalculated for MARINE at 100M bounty → CAPTAIN
        assertThat(user.getRank()).isEqualTo("CAPTAIN");
        verify(userRepository).save(user);
    }

    @Test
    void updateProfile_switchToPirateWithoutAvatar_allowed() {
        User user = buildUser(Filiation.MARINE, null);
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateProfileRequest request = new UpdateProfileRequest(Filiation.PIRATE, null);
        UserResponse response = userService.updateProfile(user.getId(), request);

        assertThat(response.avatar()).isNull();
        assertThat(response.filiation()).isEqualTo(Filiation.PIRATE);
        assertThat(user.getFiliation()).isEqualTo(Filiation.PIRATE);
        // Rank should be recalculated for PIRATE at 100M bounty → SUPER_ROOKIE
        assertThat(user.getRank()).isEqualTo("SUPER_ROOKIE");
        verify(userRepository).save(user);
    }

    @Test
    void updateProfile_switchToPirateWithAvatar_setsAvatarAndUpdatesRank() {
        User user = buildUser(Filiation.MARINE, null);
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateProfileRequest request = new UpdateProfileRequest(Filiation.PIRATE, "ACE");
        UserResponse response = userService.updateProfile(user.getId(), request);

        assertThat(response.avatar()).isEqualTo("ACE");
        assertThat(response.filiation()).isEqualTo(Filiation.PIRATE);
        assertThat(user.getAvatar()).isEqualTo(Avatar.ACE);
        assertThat(user.getRank()).isEqualTo("SUPER_ROOKIE");
        verify(userRepository).save(user);
    }

    @Test
    void updateProfile_invalidAvatarString_throwsBadRequest() {
        User user = buildUser(Filiation.PIRATE, null);
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));

        UpdateProfileRequest request = new UpdateProfileRequest(null, "INVALID");

        assertThatThrownBy(() -> userService.updateProfile(user.getId(), request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Invalid avatar value");
    }

    private User buildUser(Filiation filiation, Avatar avatar) {
        User user = User.builder()
                .name("TestUser")
                .email("test@example.com")
                .passwordHash("hashedpassword")
                .filiation(filiation)
                .avatar(avatar)
                .rank(BountyService.computeRank(BountyService.STARTING_BOUNTY, filiation))
                .bounty(BountyService.STARTING_BOUNTY)
                .wins(5)
                .losses(3)
                .totalShots(100)
                .totalHits(60)
                .build();
        user.setId(UUID.randomUUID());
        return user;
    }
}
