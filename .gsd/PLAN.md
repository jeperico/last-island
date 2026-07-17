# Plan: Armament Haki Backend

## Objective

Implement the Armament Haki passive ability: ship assignment during placement, automatic triggers on opponent hits (turn skip + Lv3 counter-fire), and full unit test coverage.

## Files to touch

- **create** `service/src/main/resources/db/migration/V13__add_armament_to_haki_battle_state.sql`
- **modify** `service/src/main/java/com/last_island/api/domain/haki/entity/HakiBattleState.java`
- **create** `service/src/main/java/com/last_island/api/domain/haki/dto/ArmamentAssignmentRequest.java`
- **create** `service/src/main/java/com/last_island/api/domain/haki/dto/ArmamentTriggerResult.java`
- **create** `service/src/main/java/com/last_island/api/domain/haki/dto/CounterFireResult.java`
- **modify** `service/src/main/java/com/last_island/api/domain/board/dto/ShotResponse.java`
- **modify** `service/src/main/java/com/last_island/api/domain/haki/service/HakiBattleService.java`
- **modify** `service/src/main/java/com/last_island/api/domain/board/service/BoardService.java`
- **modify** `service/src/main/java/com/last_island/api/domain/game/controller/GameController.java`
- **modify** `service/src/main/java/com/last_island/api/infrastructure/sse/GameEvent.java`
- **modify** `service/src/main/java/com/last_island/api/infrastructure/sse/GameEventEmitter.java`
- **create** `service/src/test/java/com/last_island/api/domain/haki/service/HakiArmamentServiceTest.java`
- **modify** `service/src/test/java/com/last_island/api/domain/board/service/BoardServiceFireShotTest.java`

## Steps

### 1. DB migration — V13

Create `V13__add_armament_to_haki_battle_state.sql`:

```sql
ALTER TABLE haki_battle_state
    ADD COLUMN armament_level INT NOT NULL DEFAULT 0,
    ADD COLUMN armament_ship1_id UUID REFERENCES ships(id),
    ADD COLUMN armament_ship2_id UUID REFERENCES ships(id),
    ADD COLUMN armament_ship1_hits_absorbed INT NOT NULL DEFAULT 0,
    ADD COLUMN armament_ship2_hits_absorbed INT NOT NULL DEFAULT 0,
    ADD COLUMN opponent_skip_turns INT NOT NULL DEFAULT 0;
```

- `armament_level` — player's armament level (0-3) at time of game start
- `armament_ship1_id` — the "weak" ship (Lv1+)
- `armament_ship2_id` — the "strong" or "awakened" ship (Lv2+, nullable)
- `armament_ship1_hits_absorbed` — counts how many Armament-triggering hits ship1 has absorbed (max 1 for weak)
- `armament_ship2_hits_absorbed` — counts how many Armament-triggering hits ship2 has absorbed (max 3 for strong/awakened)
- `opponent_skip_turns` — accumulated turn-skip debt the board's OPPONENT owes (decremented each time a turn is skipped)

### 2. Update HakiBattleState entity

Add 6 new fields matching the migration columns:
- `armamentLevel` (int, default 0)
- `armamentShip1Id` (UUID, nullable)
- `armamentShip2Id` (UUID, nullable)
- `armamentShip1HitsAbsorbed` (int, default 0)
- `armamentShip2HitsAbsorbed` (int, default 0)
- `opponentSkipTurns` (int, default 0) — how many turns the OPPONENT of this board must skip

### 3. Create DTOs

**ArmamentAssignmentRequest** — record with:
- `UUID ship1Id` — required; the ship receiving weak buff
- `UUID ship2Id` — nullable; the ship receiving strong/awakened buff (only for Lv2+)

**ArmamentTriggerResult** — record with:
- `boolean turnSkipped` — whether the attacker must skip next turn
- `CounterFireResult counterFire` — nullable; present only for Lv3 awakened triggers

**CounterFireResult** — record with:
- `ShotResult result` (HIT/MISS/SUNK)
- `int row`
- `int col`
- `String sunkShipType` — nullable

### 4. Extend ShotResponse

Add two new nullable fields:
- `boolean armamentTriggered` — true if the shot triggered Armament Haki
- `CounterFireResult counterFire` — nullable; counter-fire details for Lv3

Update all existing ShotResponse constructor call sites to include the new fields (set `false`/`null` for non-armament paths).

### 5. Implement HakiBattleService — armament methods

**a) `assignArmament(String token, UUID userId, ArmamentAssignmentRequest request)`**

Validates:
- Game exists and phase == PLACING_SHIPS
- User is a participant
- User's board has ships placed (non-empty)
- User has armament_level >= 1 in their HakiProfile
- ship1Id belongs to the user's board
- If Lv2+: ship2Id is provided and belongs to user's board; ship2Id ≠ ship1Id
- If Lv1: ship2Id must be null

Stores armamentShip1Id / armamentShip2Id on the user's HakiBattleState. If HakiBattleState doesn't exist yet (game hasn't started), create it early or queue assignment. **Resolution:** Since `initializeHakiBattleStates` is called when BOTH players have placed, and the assignment endpoint is called DURING placement (before or after placing but while still in PLACING_SHIPS), the flow is:
1. Player places ships → ships are persisted (have IDs)
2. Player calls POST /games/{token}/haki/armament with ship IDs
3. If HakiBattleState doesn't exist yet (game not started), save assignment to a temporary state or create the HakiBattleState early

**Better approach:** Modify `initializeForBoard` to also set armament_level from HakiProfile but leave ship IDs null. The assignment endpoint writes ship IDs to the existing HakiBattleState (which won't exist until game starts). **Simplest approach:** Create HakiBattleState as part of `placeShips` for EACH board individually (not just when both are ready). Then armament assignment can always find the state.

**Final design:** 
1. Split `initializeHakiBattleStates` → call `initializeForBoard(board)` immediately after each player places ships (before checking if opponent is ready), instead of only when both are ready.
2. `assignArmament` then finds the existing HakiBattleState by boardId and sets ship IDs.
3. The existing observation initialization (uses remaining) is set from HakiProfile during `initializeForBoard` which now happens per-player at placement time.

**b) `checkArmamentTrigger(Board defenderBoard, Ship hitShip, int hitRow, int hitCol, Board attackerBoard)`**

Called from `BoardService.fireShot` after a HIT/SUNK is resolved on a ship. Logic:
1. Fetch defenderBoard's HakiBattleState
2. Check if `hitShip.getId()` matches `armamentShip1Id` or `armamentShip2Id`
3. If no match → return null (no trigger)
4. If ship1 match (weak): check `armamentShip1HitsAbsorbed < 1`. If so, increment, set `opponentSkipTurns += 1`, return trigger result.
5. If ship2 match (strong/awakened):
   - Check `armamentShip2HitsAbsorbed < 3`. If so, increment.
   - Set `opponentSkipTurns += 1`
   - If armamentLevel == 3 (awakened): execute counter-fire on attacker's board
6. Return `ArmamentTriggerResult`

**c) `resolveCounterFire(Board attackerBoard, int targetRow, int targetCol)`**

Fires the same coordinate on the attacker's board:
1. Check if (targetRow, targetCol) already has a shot on attackerBoard
2. If not → fire there
3. If already hit → find adjacent cell (8 neighbors: orthogonal + diagonal) that has no shot. Pick first available.
4. If ALL 8 adjacent cells already hit → expand to distance 2 (16 possible cells). Pick first available.
5. Always finds a cell (board is 10x10 = 100 cells; at most ~17 shots could hit a ship so there are always free cells nearby).
6. Resolve the shot: check attacker's ships for HIT/MISS/SUNK. Create Shot entity on attackerBoard. Update defender stats.
7. **Guard:** Counter-fire does NOT recursively trigger Armament (even if it hits an armored ship on attacker's board). This is enforced by calling the raw shot resolution logic without the armament check.
8. Return `CounterFireResult(result, row, col, sunkShipType)`

**d) `consumeSkipTurn(UUID boardId)`** — called from BoardService when turn would switch. Decrements `opponentSkipTurns` and returns true if a skip was consumed.

### 6. Modify BoardService.fireShot — integrate Armament

After step 7 (shot resolved, hitShip identified) and BEFORE step 11 (turn switch):

```java
// 7b. Check Armament trigger
ArmamentTriggerResult armamentResult = null;
if (hitShip != null && (result == ShotResult.HIT || result == ShotResult.SUNK)) {
    armamentResult = hakiBattleService.checkArmamentTrigger(
        opponentBoard, hitShip, request.row(), request.col(), playerBoard);
}
```

Modify step 11 (turn switch) to account for skip turns:

```java
// 11. Switch turn — check skip debt
if (result == ShotResult.MISS) {
    // Normal: turn goes to opponent
    game.setCurrentTurn(opponentBoard.getOwner());
    game.setTurnStartedAt(LocalDateTime.now());
    hakiBattleService.resetHakiUsedThisTurn(opponentBoard.getId());

    // But if attacker has accumulated skip debt, opponent gets an extra turn
    // (skip debt is on the ATTACKER's next turn after this sequence ends)
    // Actually: opponentSkipTurns is stored on DEFENDER's state meaning
    // "the attacker owes N skipped turns"
    // When MISS happens (turn switches to defender), check if DEFENDER's state
    // has opponentSkipTurns > 0. If so, after defender's turn, attacker will be skipped.
    // Implementation: when it's attacker's "turn" next and skip > 0, auto-pass.
    // Simpler: on MISS, if the DEFENDER's HakiBattleState.opponentSkipTurns > 0:
    //   - decrement opponentSkipTurns
    //   - DON'T give turn to opponent immediately — instead keep turn with opponent
    //     (i.e., the attacker's next turn is skipped, defender plays again)
    //   Wait — that's what normally happens. On MISS, turn goes to opponent (defender).
    //   The skip means: after the DEFENDER takes their turn and MISSes, turn should
    //   NOT go back to attacker — it stays with defender for another round.
    //   
    //   Better model: opponentSkipTurns on defenderBoard means "the OPPONENT of this
    //   board (the attacker) must skip N turns". When the ATTACKER's turn would START
    //   (i.e., defender just MISSed and turn switches to attacker), check if
    //   defenderBoard.hakiBattleState.opponentSkipTurns > 0. If so, skip the attacker:
    //   turn stays with defender, decrement counter.
    //
    //   So the check goes at the point where turn switches TO a player. If that player
    //   has skip debt (tracked on their OPPONENT's board state), they lose the turn.
}
```

**Refined turn-skip logic:**

The `opponentSkipTurns` field on a board's HakiBattleState means: "the owner of this board has caused the opponent to owe N skipped turns."

When a turn switch occurs (would-be receiver is player X), check if X's OPPONENT board's HakiBattleState has `opponentSkipTurns > 0`. If yes:
- Decrement `opponentSkipTurns`
- Do NOT give turn to X — keep turn with the current player (or set turn back to the other player)
- Emit SSE to X: "Armament Haki — your turn is skipped!"

In practice for `fireShot`:
- On MISS: turn normally goes to defender. Then check: does the ATTACKER owe skips? (i.e., defender's HakiBattleState.opponentSkipTurns > 0). If yes, after switching to defender, the NEXT time defender MISSes and turn would go to attacker, attacker is skipped. This is a **deferred** mechanism.
- **Simpler implementation:** When turn switches to a player, immediately check their skip debt. This check lives at the BEGINNING of turn resolution or as a post-switch hook.

**Simplest approach:** After turn switch in `fireShot` (and also in turn expiration), add:
```java
// After setting new current turn to 'nextPlayer':
UUID nextPlayerBoardId = getPlayerBoard(game, nextPlayer).getId(); // the board of the player receiving the turn
HakiBattleState opponentState = getOpponentBoardState(game, nextPlayer); // opponent's state that tracks skips owed
if (opponentState != null && opponentState.getOpponentSkipTurns() > 0) {
    opponentState.setOpponentSkipTurns(opponentState.getOpponentSkipTurns() - 1);
    // Skip: switch turn BACK to the other player
    game.setCurrentTurn(otherPlayer);
    game.setTurnStartedAt(LocalDateTime.now());
    // Emit turn-skipped SSE to nextPlayer
}
```

This means the turn skip resolves immediately when the attacker would receive their turn.

### 7. Add SSE event

**GameEvent:** Add `ARMAMENT_HAKI_TRIGGERED` constant.

**GameEventEmitter:** Add method:
```java
public void emitArmamentHakiTriggered(String gameToken, UUID attackerId, boolean turnSkipped, CounterFireResult counterFire)
```
Sends to the attacker: armament triggered notification with counter-fire details if applicable.

### 8. Add API endpoint

In `GameController`, add:
```java
@PostMapping("/{token}/haki/armament")
@ResponseStatus(HttpStatus.NO_CONTENT)
public void assignArmament(@PathVariable String token,
                           @RequestBody ArmamentAssignmentRequest request,
                           @AuthenticationPrincipal AuthenticatedUser principal) {
    hakiBattleService.assignArmament(token, principal.getId(), request);
}
```

### 9. Modify initializeForBoard — early creation

Move `initializeForBoard(board)` call from the "both players ready" block to immediately after a player's ships are built (after step 9 in placeShips). This ensures HakiBattleState exists per-board as soon as ships are placed, allowing armament assignment before the opponent places.

Update `initializeForBoard` to also set `armamentLevel` from HakiProfile:
```java
int armamentLevel = (profile != null) ? profile.getArmamentLevel() : 0;
// ... add to builder
.armamentLevel(armamentLevel)
```

Handle redeployment: if HakiBattleState already exists for this boardId (player re-placed ships), reset armament fields (clear ship IDs, reset hits absorbed, keep levels).

### 10. Unit tests — HakiArmamentServiceTest

Create comprehensive test class covering:

**Assignment validation tests:**
- `assignArmament_lv1_setsShip1_succeeds`
- `assignArmament_lv1_withShip2_throwsBadRequest`
- `assignArmament_lv2_setsBothShips_succeeds`
- `assignArmament_lv2_sameShipForBoth_throwsBadRequest`
- `assignArmament_shipNotOnBoard_throwsBadRequest`
- `assignArmament_noArmamentLevel_throwsBadRequest`
- `assignArmament_wrongPhase_throwsBadRequest`
- `assignArmament_notParticipant_throwsForbidden`

**Trigger tests:**
- `checkArmament_lv1_firstHitOnShip1_setsSkipTurn`
- `checkArmament_lv1_secondHitOnShip1_noTrigger`
- `checkArmament_lv2_ship2_first3Hits_eachTriggersSkip`
- `checkArmament_lv2_ship2_fourthHit_noTrigger`
- `checkArmament_lv3_ship2_triggersSkipAndCounterFire`
- `checkArmament_hitNonArmoredShip_noTrigger`

**Counter-fire tests:**
- `counterFire_targetCellEmpty_firesOnSameCoordinate`
- `counterFire_targetCellAlreadyHit_firesAdjacentCell`
- `counterFire_allAdjacentHit_firesDistance2Cell`
- `counterFire_hitsShipOnAttackerBoard_resolvesHit`
- `counterFire_sinksShipOnAttackerBoard_resolvesSunk`
- `counterFire_doesNotTriggerRecursiveArmament`

**Turn skip integration tests:**
- `turnSkip_afterMiss_attackerTurnSkipped`
- `turnSkip_multipleStacked_allConsumedSequentially`

### 11. Update BoardServiceFireShotTest

Add/modify tests to verify armament integration in fireShot:
- Mock `hakiBattleService.checkArmamentTrigger` returning null (no trigger) for existing tests
- Add test: fireShot hitting armored ship returns armamentTriggered=true in ShotResponse
- Add test: turn skip debt properly consumed on MISS

## Verification

```bash
cd service && mvn compile
cd service && mvn test
cd service && mvn test -Dtest=HakiArmamentServiceTest
cd service && mvn test -Dtest=BoardServiceFireShotTest
cd service && mvn test -Dtest=HakiBattleServiceTest
grep -r "armamentShip\|armamentLevel\|opponentSkipTurns\|counterFire" service/src/test/
grep -r "ARMAMENT_HAKI_TRIGGERED" service/src/
```

Manual checks:
- V13 SQL syntax is valid ALTER TABLE with correct FK references
- Counter-fire code path does NOT call `checkArmamentTrigger` (no recursion)
- `opponentSkipTurns` is decremented exactly once per skipped turn
- ShotResponse changes are backward-compatible (new fields can be null/false)

## Rollback

```bash
git checkout -- service/src/main/java/com/last_island/api/domain/haki/entity/HakiBattleState.java
git checkout -- service/src/main/java/com/last_island/api/domain/haki/service/HakiBattleService.java
git checkout -- service/src/main/java/com/last_island/api/domain/board/service/BoardService.java
git checkout -- service/src/main/java/com/last_island/api/domain/board/dto/ShotResponse.java
git checkout -- service/src/main/java/com/last_island/api/domain/game/controller/GameController.java
git checkout -- service/src/main/java/com/last_island/api/infrastructure/sse/GameEvent.java
git checkout -- service/src/main/java/com/last_island/api/infrastructure/sse/GameEventEmitter.java
git checkout -- service/src/test/java/com/last_island/api/domain/board/service/BoardServiceFireShotTest.java
rm -f service/src/main/resources/db/migration/V13__add_armament_to_haki_battle_state.sql
rm -f service/src/main/java/com/last_island/api/domain/haki/dto/ArmamentAssignmentRequest.java
rm -f service/src/main/java/com/last_island/api/domain/haki/dto/ArmamentTriggerResult.java
rm -f service/src/main/java/com/last_island/api/domain/haki/dto/CounterFireResult.java
rm -f service/src/test/java/com/last_island/api/domain/haki/service/HakiArmamentServiceTest.java
```
