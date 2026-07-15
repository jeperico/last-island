package com.last_island.api.domain.user.repository;

import com.last_island.api.domain.user.entity.User;
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

    @Query("SELECT u FROM User u ORDER BY u.bounty DESC, u.name ASC LIMIT 10")
    List<User> findTop10ByOrderByBountyDesc();

    @Query("SELECT COUNT(u) FROM User u WHERE u.bounty > :bounty OR (u.bounty = :bounty AND u.name < :name)")
    long countUsersAhead(@Param("bounty") double bounty, @Param("name") String name);
}
