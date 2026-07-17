package com.last_island.api.domain.haki.repository;

import com.last_island.api.domain.haki.entity.HakiProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface HakiProfileRepository extends JpaRepository<HakiProfile, UUID> {

    Optional<HakiProfile> findByUserId(UUID userId);
}
