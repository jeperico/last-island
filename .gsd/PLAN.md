# Fix Armament Haki Turn-Skip Stacking Bug

## Objective

Cap Armament Haki's `opponentSkipTurns` at 1 (no stacking), add `current_turn_player_name` to `ShotResponse`, and make the frontend use the server-returned turn owner instead of optimistic computation.

## Files to touch

- modify `service/src/main/java/com/last_island/api/domain/haki/service/HakiBattleService.java` — cap armament skip at 1
- modify `service/src/main/java/com/last_island/api/domain/board/dto/ShotResponse.java` — add `currentTurnPlayerName` field
- modify `service/src/main/java/com/last_island/api/domain/board/service/BoardService.java` — pass `game.getCurrentTurn().getName()` to ShotResponse
- modify `service/src/test/java/com/last_island/api/domain/haki/service/HakiArmamentServiceTest.java` — update stacking assertion (3→1)
- modify `service/src/test/java/com/last_island/api/domain/board/service/BoardServiceFireShotTest.java` — assert `currentTurnPlayerName` in responses
- modify `client/src/interfaces/api.ts` — add `currentTurnPlayerName` to ShotResponse interface
- modify `client/src/app/game/[token]/battle-screen.tsx` — use `response.currentTurnPlayerName` instead of optimistic computation

## Steps

1. **Cap armament skip at 1 in `HakiBattleService.applyArmamentSkipOrEat()`**
   - Change line 241 from `defenderState.setOpponentSkipTurns(defenderState.getOpponentSkipTurns() + 1)` to `defenderState.setOpponentSkipTurns(1)` (set, not increment). This makes repeated armament triggers idempotent — the field stays at 1 regardless of how many armored hits land.
   - Conqueror's Haki (line 437) is NOT changed — its multi-turn skip (3 or 5) is intentional.

2. **Add `currentTurnPlayerName` to `ShotResponse` record**
   - Add a `String currentTurnPlayerName` parameter to the record. Update both constructors:
     - Game-over constructor: pass `null` (game is over, no next turn).
     - Normal constructor: accept `currentTurnPlayerName` as a new parameter.
   - Jackson will serialize it as `current_turn_player_name` (Spring Boot's default snake_case property naming).

3. **Pass current turn player name in `BoardService.fireShot()`**
   - After turn switch logic (line ~340), capture `game.getCurrentTurn().getName()`.
   - Pass it to the final `new ShotResponse(...)` call on line 378.
   - For the game-over return (line 310), pass `null`.

4. **Update `HakiArmamentServiceTest.checkArmament_lv2_ship2_first3Hits_eachTriggersSkip()`**
   - Change the final assertion from `assertThat(state.getOpponentSkipTurns()).isEqualTo(3)` to `assertThat(state.getOpponentSkipTurns()).isEqualTo(1)` — multiple hits no longer stack.

5. **Update `BoardServiceFireShotTest` assertions**
   - In tests that build ShotResponse expectations, verify `currentTurnPlayerName()` matches the expected turn owner after the shot resolves.

6. **Add `currentTurnPlayerName` to frontend `ShotResponse` interface**
   - In `client/src/interfaces/api.ts`, add `currentTurnPlayerName: string | null;` to the `ShotResponse` interface.

7. **Replace optimistic turn computation in `battle-screen.tsx`**
   - In the shot handler (lines ~201-208), replace the `newCurrentTurn` derivation block:
     ```typescript
     // Before (optimistic):
     const newCurrentTurn = response.result === "MISS"
       ? gameState.bluePlayerName === user.name ? gameState.redPlayerName : gameState.bluePlayerName
       : gameState.currentTurnPlayerName;
     
     // After (server-authoritative):
     const newCurrentTurn = response.currentTurnPlayerName ?? gameState.currentTurnPlayerName;
     ```
   - This handles HIT (attacker keeps turn), MISS (server says who's next), and skip-consumed (server already bounced turn back).

## Verification

```bash
# 1. Backend compiles
make service-build

# 2. All backend tests pass (167 expected)
make service-test

# 3. Frontend builds without errors
make client-build

# 4. Frontend lint passes
make client-lint

# 5. Grep: armament skip is set, not incremented
grep -n "setOpponentSkipTurns(1)" service/src/main/java/com/last_island/api/domain/haki/service/HakiBattleService.java

# 6. Grep: no increment remains in applyArmamentSkipOrEat
grep -n "getOpponentSkipTurns() + 1" service/src/main/java/com/last_island/api/domain/haki/service/HakiBattleService.java | grep -v "Conqueror"

# 7. Grep: currentTurnPlayerName in ShotResponse record
grep -n "currentTurnPlayerName" service/src/main/java/com/last_island/api/domain/board/dto/ShotResponse.java

# 8. Grep: frontend uses response.currentTurnPlayerName
grep -n "response.currentTurnPlayerName" client/src/app/game/\[token\]/battle-screen.tsx

# 9. Grep: no old optimistic turn logic remains
grep -n "bluePlayerName.*redPlayerName\|redPlayerName.*bluePlayerName" client/src/app/game/\[token\]/battle-screen.tsx
```

Check #6 should return zero lines (the only `+1` remaining should be Conqueror's at line 437).
Check #9 should return zero lines (optimistic swap removed).

## Rollback

```bash
git checkout -- \
  service/src/main/java/com/last_island/api/domain/haki/service/HakiBattleService.java \
  service/src/main/java/com/last_island/api/domain/board/dto/ShotResponse.java \
  service/src/main/java/com/last_island/api/domain/board/service/BoardService.java \
  service/src/test/java/com/last_island/api/domain/haki/service/HakiArmamentServiceTest.java \
  service/src/test/java/com/last_island/api/domain/board/service/BoardServiceFireShotTest.java \
  client/src/interfaces/api.ts \
  client/src/app/game/\[token\]/battle-screen.tsx
```
