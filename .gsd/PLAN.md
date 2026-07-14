# K-factor Elo-style Bounty System with One Piece Themed Ranks

## Objective

Implement a K-factor Elo rating system where player bounties are updated after each game, ranks are derived from bounty thresholds + filiation, and the leaderboard sorts by stored bounty instead of a computed formula.

## Files to touch

- **create** `service/src/main/resources/db/migration/V6__update_bounty_default_and_backfill.sql` — Change bounty DEFAULT to 1000, backfill existing users, update ranks
- **create** `service/src/main/java/com/last_island/api/domain/user/service/BountyService.java` — Elo calculation + rank derivation logic
- **create** `service/src/test/java/com/last_island/api/domain/user/service/BountyServiceTest.java` — Unit tests for Elo + rank
- **modify** `service/src/main/java/com/last_island/api/domain/user/service/AuthService.java` — Change starting bounty from 0 to 1000, derive initial rank via BountyService
- **modify** `service/src/main/java/com/last_island/api/domain/board/service/BoardService.java` — Call BountyService.updateBounties after game over
- **modify** `service/src/main/java/com/last_island/api/domain/game/service/GameService.java` — Call BountyService.updateBounties after IN_PROGRESS surrender
- **modify** `service/src/main/java/com/last_island/api/domain/game/service/GameExpirationService.java` — Call BountyService.updateBounties after turn expiration
- **modify** `service/src/main/java/com/last_island/api/domain/user/repository/UserRepository.java` — Replace formula ORDER BY with `u.bounty DESC`
- **modify** `service/src/main/java/com/last_island/api/domain/user/service/LeaderboardService.java` — Remove local formula, use stored bounty for position calculation
- **modify** `client/src/app/page.tsx` — Replace client-side bounty formula with `entry.bounty` field

## Steps

1. **Create Flyway migration V6** (`V6__update_bounty_default_and_backfill.sql`):
   - `ALTER TABLE users ALTER COLUMN bounty SET DEFAULT 1000;`
   - `UPDATE users SET bounty = 1000 WHERE bounty = 0;` (backfill existing users to starting Elo)
   - `UPDATE users SET rank = CASE WHEN filiation = 'PIRATE' THEN 'SUPER_ROOKIE' WHEN filiation = 'MARINE' THEN 'CAPTAIN' END WHERE bounty = 1000;` (1000 is the first tier of second rank)

2. **Create BountyService** with:
   - Constants: `K_FACTOR = 32`, `STARTING_BOUNTY = 1000`, `BOUNTY_FLOOR = 0`
   - Rank thresholds as static arrays/maps for pirate and marine
   - `updateBounties(User winner, User loser)`:
     - Compute expected scores for both players
     - Compute new bounties: `newBounty = oldBounty + K * (actual - expected)`, floor at 0
     - Set new bounties on User entities
     - Derive and set new rank strings from bounty + filiation via `computeRank(long bounty, Filiation filiation)`
   - `computeRank(long bounty, Filiation filiation)` — returns rank String based on thresholds:
     - 0-999: ROOKIE / SEAMAN
     - 1000-1499: SUPER_ROOKIE / CAPTAIN
     - 1500-1999: SUPERNOVA / COMMODORE
     - 2000-2499: SHICHIBUKAI / VICE_ADMIRAL
     - 2500-2999: YONKO / ADMIRAL
     - 3000+: PIRATE_KING / FLEET_ADMIRAL

3. **Create BountyServiceTest** with cases:
   - Equal bounty match (1000 vs 1000): winner gains 16, loser loses 16
   - Asymmetric match (high vs low): underdog wins → big gain, favorite wins → small gain
   - Bounty floor: loser with bounty near 0 cannot go negative
   - Rank promotion: bounty crosses 1500 threshold → rank updates (pirate & marine variants)
   - Rank demotion: bounty drops below 1000 → rank downgrades

4. **Modify AuthService** (registration):
   - Change `.bounty(0)` to `.bounty(1000)`
   - Change `defaultRank` logic to use `BountyService.computeRank(1000, filiation)` (or inline: PIRATE→"SUPER_ROOKIE", MARINE→"CAPTAIN")
   - Inject BountyService or make `computeRank` static

5. **Modify BoardService.fireShot** (game over section, around line 275):
   - After `attacker.setWins(...)` / `loser.setLosses(...)`, add: `bountyService.updateBounties(attacker, loser);`
   - Inject `BountyService` into BoardService constructor

6. **Modify GameService.surrender** (IN_PROGRESS branch, around line 222):
   - After `winner.setWins(...)` / `loser.setLosses(...)`, add: `bountyService.updateBounties(winner, loser);`
   - Inject `BountyService` into GameService constructor

7. **Modify GameExpirationService.handleTurnExpiration** (around line 97):
   - After `winner.setWins(...)` / `loser.setLosses(...)`, add: `bountyService.updateBounties(winner, loser);`
   - Inject `BountyService` into GameExpirationService constructor

8. **Modify UserRepository JPQL queries** — replace all 4 queries:
   - `findTop10ByOrderByBountyDesc`: `ORDER BY u.bounty DESC, u.name ASC LIMIT 10`
   - `findTop10ByFiliationOrderByBountyDesc`: same with filiation filter
   - `countUsersAhead`: `WHERE u.bounty > :bounty OR (u.bounty = :bounty AND u.name < :name)`
   - `countUsersAheadByFiliation`: same with filiation filter

9. **Modify LeaderboardService.buildCurrentUserEntry**:
   - Remove the local `userBounty = user.getWins() * user.getWinRate() * 10000.0` formula
   - Use `(double) user.getBounty()` as the `bounty` param to `countUsersAhead`/`countUsersAheadByFiliation`

10. **Modify frontend `client/src/app/page.tsx`** (around line 388):
    - Replace `Math.round(entry.wins * entry.winRate * 10000).toLocaleString()` with `entry.bounty.toLocaleString()`

## Verification

```bash
cd service && mvn test
```
- Expect all existing tests to pass + BountyServiceTest (5+ new tests)

```bash
cd client && npm run build
```
- Expect clean build (no compilation errors)

```bash
cd client && npm run lint
```
- Expect no new lint errors (pre-existing ones acceptable)

Manual verification:
- Register two new users → both start with bounty 1000 and rank SUPER_ROOKIE/CAPTAIN
- Play a full game → winner bounty increases (1016), loser decreases (984), ranks update if threshold crossed
- Leaderboard sorts by actual bounty value from API, not client-side formula

## Rollback

```bash
cd service && git checkout -- src/main/java/com/last_island/api/domain/user/service/BountyService.java \
  src/test/java/com/last_island/api/domain/user/service/BountyServiceTest.java \
  src/main/java/com/last_island/api/domain/user/service/AuthService.java \
  src/main/java/com/last_island/api/domain/board/service/BoardService.java \
  src/main/java/com/last_island/api/domain/game/service/GameService.java \
  src/main/java/com/last_island/api/domain/game/service/GameExpirationService.java \
  src/main/java/com/last_island/api/domain/user/repository/UserRepository.java \
  src/main/java/com/last_island/api/domain/user/service/LeaderboardService.java \
  src/main/resources/db/migration/V6__update_bounty_default_and_backfill.sql
cd client && git checkout -- src/app/page.tsx
```

If already applied to DB, run manually:
```sql
ALTER TABLE users ALTER COLUMN bounty SET DEFAULT 0;
UPDATE users SET bounty = 0;
DELETE FROM flyway_schema_history WHERE version = '6';
```
