# Remove one-active-game-per-player constraint

## Objective
Allow a player to participate in multiple concurrent games by removing the `hasActiveGame` check from game creation and joining.

## Files to touch
- modify: `src/main/java/com/last_island/api/domain/game/service/GameService.java` — remove both `hasActiveGame` guard clauses (lines 39-41 in `createGame`, lines 76-78 in `joinGame`)
- modify: `src/main/java/com/last_island/api/domain/game/repository/GameRepository.java` — remove `hasActiveGame` method and its `@Query` annotation
- modify: `src/test/java/com/last_island/api/domain/game/service/GameServiceTest.java` — remove `createGame_alreadyActive_rejects` and `joinGame_alreadyActive_rejects` tests; remove `hasActiveGame` mocking from `createGame_success` and `joinGame_success`

## Steps
1. In `GameService.java`, delete the `if (gameRepository.hasActiveGame(userId))` block (lines 39-41) in the `createGame` method.
2. In `GameService.java`, delete the `if (gameRepository.hasActiveGame(userId))` block (lines 76-78) in the `joinGame` method.
3. In `GameRepository.java`, delete the `hasActiveGame` method declaration and its `@Query` annotation (lines 22-24).
4. In `GameServiceTest.java`, delete the test `createGame_alreadyActive_rejects` entirely.
5. In `GameServiceTest.java`, delete the test `joinGame_alreadyActive_rejects` entirely.
6. In `GameServiceTest.java`, remove the `when(gameRepository.hasActiveGame(...)).thenReturn(false)` line from `createGame_success`.
7. In `GameServiceTest.java`, remove the `when(gameRepository.hasActiveGame(...)).thenReturn(false)` line from `joinGame_success`.

## Verification
```bash
# 1. Compile passes
./mvnw compile -q && echo "PASS: compile"

# 2. All tests pass (should be 34 = 36 - 2 removed)
make test

# 3. No references to hasActiveGame remain in codebase
grep -r "hasActiveGame" src/ && echo "FAIL: hasActiveGame still referenced" || echo "PASS: no hasActiveGame references"

# 4. No "already have an active battle" message remains
grep -r "already have an active battle" src/ && echo "FAIL: old message still present" || echo "PASS: constraint removed"
```

## Rollback
```bash
git checkout -- src/main/java/com/last_island/api/domain/game/service/GameService.java \
                src/main/java/com/last_island/api/domain/game/repository/GameRepository.java \
                src/test/java/com/last_island/api/domain/game/service/GameServiceTest.java
```
