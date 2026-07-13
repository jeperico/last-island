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

    List<User> findTop10ByOrderByWinsDescNameAsc();

    List<User> findTop10ByFiliationOrderByWinsDescNameAsc(Filiation filiation);

    @Query("SELECT COUNT(u) FROM User u WHERE u.wins > :wins OR (u.wins = :wins AND u.name < :name)")
    long countUsersAhead(@Param("wins") int wins, @Param("name") String name);

    @Query("SELECT COUNT(u) FROM User u WHERE u.filiation = :filiation AND (u.wins > :wins OR (u.wins = :wins AND u.name < :name))")
    long countUsersAheadByFiliation(@Param("filiation") Filiation filiation, @Param("wins") int wins, @Param("name") String name);
}
