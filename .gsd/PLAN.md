# Backend: Avatar Data Model + API

## Objective

Add a nullable Avatar enum to the User entity with a Flyway migration, expose it in all relevant API responses (auth/me, game state, leaderboard), create a PUT /users/me endpoint for profile updates (avatar + filiation switching), and add unit tests for the update logic.

## Files to touch

- **create** `service/src/main/resources/db/migration/V8__add_avatar_column.sql`
- **create** `service/src/main/java/com/last_island/api/domain/user/enums/Avatar.java`
- **modify** `service/src/main/java/com/last_island/api/domain/user/entity/User.java` — add avatar field
- **create** `service/src/main/java/com/last_island/api/domain/user/dto/UpdateProfileRequest.java`
- **modify** `service/src/main/java/com/last_island/api/domain/user/dto/RegisterRequest.java` — add optional avatar field
- **modify** `service/src/main/java/com/last_island/api/domain/user/dto/UserResponse.java` — add avatar field
- **modify** `service/src/main/java/com/last_island/api/domain/user/dto/LeaderboardEntryResponse.java` — add avatar field
- **modify** `service/src/main/java/com/last_island/api/domain/game/dto/GameStateResponse.java` — add bluePlayerAvatar, redPlayerAvatar fields
- **modify** `service/src/main/java/com/last_island/api/domain/user/mapper/UserMapper.java` — map avatar to response
- **modify** `service/src/main/java/com/last_island/api/domain/game/mapper/GameMapper.java` — map player avatars to GameStateResponse
- **modify** `service/src/main/java/com/last_island/api/domain/user/service/LeaderboardService.java` — pass avatar to LeaderboardEntryResponse
- **modify** `service/src/main/java/com/last_island/api/domain/user/service/AuthService.java` — handle avatar in register
- **create** `service/src/main/java/com/last_island/api/domain/user/service/UserService.java` — updateProfile logic
- **modify** `service/src/main/java/com/last_island/api/domain/user/controller/UserController.java` — add PUT /me endpoint
- **create** `service/src/test/java/com/last_island/api/domain/user/service/UserServiceTest.java` — unit tests

## Steps

1. **Create Flyway migration V8__add_avatar_column.sql**
   ```sql
   ALTER TABLE users ADD COLUMN avatar VARCHAR(20);
   ```
   Nullable by default, no constraint needed (validation in app layer).

2. **Create Avatar enum** in `com.last_island.api.domain.user.enums`:
   ```java
   public enum Avatar {
       LUFFY, ZORO, ROBIN, CHOPPER, NAMI, ACE
   }
   ```

3. **Add avatar field to User entity**:
   ```java
   @Enumerated(EnumType.STRING)
   private Avatar avatar;
   ```
   No `@Column(nullable = false)` — nullable by default. Lombok @Builder will handle it.

4. **Add avatar to RegisterRequest**:
   ```java
   record RegisterRequest(String name, String email, String password, Filiation filiation, String avatar)
   ```
   Field is `String` to allow null and deferred enum parsing in service.

5. **Modify AuthService.register** — after building user, parse avatar if provided:
   - If `request.avatar()` is non-null and filiation is PIRATE, parse to `Avatar.valueOf(request.avatar())` (wrap in try-catch, throw 400 on invalid value).
   - If filiation is MARINE and avatar is non-null, throw 400 ("Marines cannot select an avatar").
   - Set `.avatar(parsedAvatar)` on the user builder.

6. **Add avatar to UserResponse**:
   ```java
   record UserResponse(UUID id, String name, String email, Filiation filiation, String rank, long bounty, int wins, int losses, String avatar)
   ```

7. **Update UserMapper.toResponse** — add `user.getAvatar() != null ? user.getAvatar().name() : null` as the avatar field.

8. **Add avatar to LeaderboardEntryResponse**:
   ```java
   record LeaderboardEntryResponse(int position, String name, String filiation, int wins, double winRate, String rank, long bounty, boolean isCurrentUser, String avatar)
   ```

9. **Update LeaderboardService** — in both the main loop and `buildCurrentUserEntry`, pass `user.getAvatar() != null ? user.getAvatar().name() : null` to the new record field.

10. **Add bluePlayerAvatar and redPlayerAvatar to GameStateResponse** — add two `String` fields after the existing player name fields.

11. **Update GameMapper.toStateResponse** — extract avatar from `game.getBlueBoard().getOwner().getAvatar()` and `game.getRedBoard().getOwner().getAvatar()` (null-safe: `owner.getAvatar() != null ? owner.getAvatar().name() : null`). Handle case where redBoard owner may be null (game not yet joined).

12. **Create UpdateProfileRequest DTO**:
    ```java
    record UpdateProfileRequest(Filiation filiation, String avatar)
    ```
    Both fields nullable in the record (String avatar for flexible parsing).

13. **Create UserService** with `@Service @RequiredArgsConstructor`:
    - Inject `UserRepository`.
    - Method: `@Transactional public UserResponse updateProfile(UUID userId, UpdateProfileRequest request)`
    - Logic:
      1. Fetch user by ID (throw 404 if not found).
      2. Determine new filiation: if `request.filiation()` is non-null, use it; otherwise keep current.
      3. Determine new avatar:
         - If new filiation is MARINE: avatar must be null. If `request.avatar()` is non-null, throw 400 ("Marines cannot select an avatar").
         - If new filiation is PIRATE and `request.avatar()` is non-null: parse via `Avatar.valueOf()`, throw 400 on invalid.
         - If new filiation is PIRATE and `request.avatar()` is null: set avatar to null (allowed — can set later).
      4. If filiation changed from current: recalculate rank via `BountyService.computeRank(user.getBounty(), newFiliation)`, set new rank.
      5. If switching to MARINE: force avatar to null regardless of request.
      6. Set fields on user entity, save.
      7. Return `UserMapper.toResponse(user)`.

14. **Add PUT /me to UserController**:
    ```java
    @PutMapping("/me")
    public UserResponse updateProfile(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @RequestBody UpdateProfileRequest request) {
        return userService.updateProfile(principal.getId(), request);
    }
    ```
    Inject `UserService` alongside existing `LeaderboardService`.

15. **Create UserServiceTest** with `@ExtendWith(MockitoExtension.class)`:
    - `@Mock UserRepository userRepository`
    - Test cases:
      1. `updateProfile_pirateSetAvatar_success` — pirate user sets valid avatar → saved with new avatar.
      2. `updateProfile_marineSetAvatar_throwsBadRequest` — marine user tries to set avatar → 400.
      3. `updateProfile_switchToMarine_clearsAvatarAndUpdatesRank` — pirate→marine, avatar nulled, rank recalculated.
      4. `updateProfile_switchToPirateWithoutAvatar_allowed` — marine→pirate, no avatar provided → success, avatar remains null.
      5. `updateProfile_switchToPirateWithAvatar_setsAvatarAndUpdatesRank` — marine→pirate with avatar → avatar set, rank recalculated.
      6. `updateProfile_invalidAvatarString_throwsBadRequest` — pirate with "INVALID" → 400.
    - Helper: `buildUser(Filiation filiation, Avatar avatar)` returning a User with sensible defaults.

## Verification

```bash
cd service && mvn clean compile
cd service && mvn test
```

Expected: all existing 73+ tests pass, plus 6 new UserServiceTest tests (79+ total). No compilation errors.

Additionally confirm:
- `V8__add_avatar_column.sql` is syntactically valid SQL.
- `UserResponse` record has 9 fields (avatar added last).
- `LeaderboardEntryResponse` record has 9 fields (avatar added last).
- `GameStateResponse` has bluePlayerAvatar/redPlayerAvatar fields.
- No frontend files modified (backend-only change).

## Rollback

```bash
git checkout -- service/
rm -f service/src/main/resources/db/migration/V8__add_avatar_column.sql
rm -f service/src/main/java/com/last_island/api/domain/user/enums/Avatar.java
rm -f service/src/main/java/com/last_island/api/domain/user/dto/UpdateProfileRequest.java
rm -f service/src/main/java/com/last_island/api/domain/user/service/UserService.java
rm -f service/src/test/java/com/last_island/api/domain/user/service/UserServiceTest.java
```
