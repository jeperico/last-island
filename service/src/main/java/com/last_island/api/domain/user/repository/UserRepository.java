package com.last_island.api.domain.user.repository;

import com.last_island.api.domain.user.entity.User;
import com.last_island.api.domain.user.enums.Filiation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByName(String name);

    @Query("SELECT u FROM User u ORDER BY " +
           "CASE WHEN (u.wins + u.losses) = 0 THEN 0 ELSE (u.wins * u.wins * 10000.0 / (u.wins + u.losses)) END DESC, " +
           "u.name ASC LIMIT 10")
    List<User> findTop10ByOrderByBountyDesc();

    @Query("SELECT u FROM User u WHERE u.filiation = :filiation ORDER BY " +
           "CASE WHEN (u.wins + u.losses) = 0 THEN 0 ELSE (u.wins * u.wins * 10000.0 / (u.wins + u.losses)) END DESC, " +
           "u.name ASC LIMIT 10")
    List<User> findTop10ByFiliationOrderByBountyDesc(@Param("filiation") Filiation filiation);

    @Query("SELECT COUNT(u) FROM User u WHERE " +
           "CASE WHEN (u.wins + u.losses) = 0 THEN 0 ELSE (u.wins * u.wins * 10000.0 / (u.wins + u.losses)) END > :bounty " +
           "OR (CASE WHEN (u.wins + u.losses) = 0 THEN 0 ELSE (u.wins * u.wins * 10000.0 / (u.wins + u.losses)) END = :bounty AND u.name < :name)")
    long countUsersAhead(@Param("bounty") double bounty, @Param("name") String name);

    @Query("SELECT COUNT(u) FROM User u WHERE u.filiation = :filiation AND (" +
           "CASE WHEN (u.wins + u.losses) = 0 THEN 0 ELSE (u.wins * u.wins * 10000.0 / (u.wins + u.losses)) END > :bounty " +
           "OR (CASE WHEN (u.wins + u.losses) = 0 THEN 0 ELSE (u.wins * u.wins * 10000.0 / (u.wins + u.losses)) END = :bounty AND u.name < :name))")
    long countUsersAheadByFiliation(@Param("filiation") Filiation filiation, @Param("bounty") double bounty, @Param("name") String name);
}
