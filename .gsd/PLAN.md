# Plan: Conqueror's Haki Backend — Activation, Cooldown, X-pattern & Tests

## Objective

Implement the Conqueror's Haki active ability backend: V14 migration, entity update, activation endpoint with level-based skip turns + X-pattern shot (Lv3), cooldown mechanics, Armament "eats skip" interaction, SSE notification, and full unit tests.

## Files to touch

- **create** `service/src/main/resources/db/migration/V14__add_conquerors_fields_to_haki_battle_state.sql`
- **modify** `service/src/main/java/com/last_island/api/domain/haki/entity/HakiBattleState.java`
- **create** `service/src/main/java/com/last_island/api/domain/haki/dto/ConquerorsActivationRequest.java`
- **create** `service/src/main/java/com/last_island/api/domain/haki/dto/ConquerorsActivationResponse.java`
- **create** `service/src/main/java/com/last_island/api/domain/haki/dto/XPatternShotResult.java`
- **modify** `service/src/main/java/com/last_island/api/domain/haki/service/HakiBattleService.java`
- **modify** `service/src/main/java/com/last_island/api/domain/board/service/BoardService.java`
- **modify** `service/src/main/java/com/last_island/api/domain/game/controller/GameController.java`
- **modify** `service/src/main/java/com/last_island/api/infrastructure/sse/GameEvent.java`
- **modify** `service/src/main/java/com/last_island/api/infrastructure/sse/GameEventEmitter.java`
- **create** `service/src/test/java/com/last_island/api/domain/haki/service/HakiConquerorsServiceTest.java`
- **modify** `service/src/test/java/com/last_island/api/domain/board/service/BoardServiceFireShotTest.java`

## Steps

### 1. V14 Migration

Create `V14__add_conquerors_fields_to_haki_battle_state.sql`:

```sql
ALTER TABLE haki_battle_state
    ADD COLUMN conquerors_level INT NOT NULL DEFAULT 0,
    ADD COLUMN conquerors_uses_consumed INT NOT NULL DEFAULT 0,
    ADD COLUMN conquerors_cooldown_turns INT NOT NULL DEFAULT 0;
```

Fields:
- `conquerors_level` — cached from HakiProfile at game start (same pattern as `observation_level`, `armament_level`)
- `conquerors_uses_consumed` — tracks how many uses consumed (0, 1, or 2). Combined with level, determines if weak or strong/awakened was used and what's left.
- `conquerors_cooldown_turns` — turns remaining before next Conqueror's use is available (1 after weak, 2 after strong/awakened)

### 2. Update HakiBattleState entity

Add three fields with `@Column` annotations and `@Builder.Default`:

```java
@Column(name = "conquerors_level", nullable = false)
@Builder.Default
private int conquerorsLevel = 0;

@Column(name = "conquerors_uses_consumed", nullable = false)
@Builder.Default
private int conquerorsUsesConsumed = 0;

@Column(name = "conquerors_cooldown_turns", nullable = false)
@Builder.Default
private int conquerorsCooldownTurns = 0;
```

### 3. Create DTOs

**ConquerorsActivationRequest** (record):
```java
public record ConquerorsActivationRequest(Integer row, Integer col) {}
```
- `row`/`col` are OPTIONAL — only required for Lv3 awakened use (X-pattern center). For Lv1/Lv2, they're null.

**XPatternShotResult** (record):
```java
public record XPatternShotResult(int row, int col, ShotResult result, String sunkShipType) {}
```

**ConquerorsActivationResponse** (record):
```java
public record ConquerorsActivationResponse(int skipTurns, String effectLevel, List<XPatternShotResult> xPatternShots) {}
```
- `skipTurns`: 3 (weak) or 5 (strong/awakened)
- `effectLevel`: "WEAK", "STRONG", or "AWAKENED"
- `xPatternShots`: null/empty for Lv1/Lv2, list of up to 5 shot results for Lv3 awakened

### 4. Modify HakiBattleService — initializeForBoard

In `initializeForBoard`, after reading `armamentLevel`, also read `conquerorsLevel`:

```java
int conquerorsLevel = (profile != null) ? profile.getConquerorsLevel() : 0;
int conquerorsUsesRemaining = computeConquerorsUses(conquerorsLevel);
```

Add to the builder:
```java
.conquerorsLevel(conquerorsLevel)
.conquerorsUsesRemaining(conquerorsUsesRemaining)
.conquerorsUsesConsumed(0)
.conquerorsCooldownTurns(0)
```

Add helper:
```java
private int computeConquerorsUses(int conquerorsLevel) {
    return switch (conquerorsLevel) {
        case 1 -> 1;
        case 2, 3 -> 2;
        default -> 0;
    };
}
```

### 5. Modify HakiBattleService — activateConquerors

New public method following `activateObservation` pattern:

```java
@Transactional
public ConquerorsActivationResponse activateConquerors(String token, UUID userId, ConquerorsActivationRequest request)
```

Logic flow:
1. Fetch game (active, by token) — 404 if not found
2. Validate phase = IN_PROGRESS — 400 otherwise
3. Identify playerBoard / opponentBoard (by userId) — 403 if not participant
4. Validate turn = userId — 409 "not your turn"
5. Fetch player's HakiBattleState — 400 if not found
6. Validate `!hakiUsedThisTurn` — 400 "already used Haki this turn"
7. Validate `conquerorsLevel > 0` — 400 "Conqueror's Haki not unlocked"
8. Validate `conquerorsUsesRemaining > 0` — 400 "No Conqueror's uses remaining"
9. Validate `conquerorsCooldownTurns == 0` — 400 "Conqueror's Haki is on cooldown"
10. Determine effect level:
    - If `conquerorsUsesConsumed == 0` → "WEAK" (always first use is weak)
    - If `conquerorsUsesConsumed == 1` and `conquerorsLevel == 2` → "STRONG"
    - If `conquerorsUsesConsumed == 1` and `conquerorsLevel == 3` → "AWAKENED"
11. Compute skip turns: WEAK → 3, STRONG/AWAKENED → 5
12. For AWAKENED: validate `row`/`col` are provided and within [0,9] — 400 otherwise. Execute X-pattern shot (see step 6 below).
13. Add skip turns to **playerBoard's** `opponentSkipTurns` (meaning "opponent of playerBoard owes N skips")
14. Update state: `conquerorsUsesRemaining -= 1`, `conquerorsUsesConsumed += 1`, `hakiUsedThisTurn = true`
15. Save state
16. Emit SSE to opponent: `CONQUERORS_HAKI_USED` with `skipTurns` data
17. Return response

### 6. HakiBattleService — X-pattern shot resolution (Lv3 awakened)

Private method `resolveXPattern(Board opponentBoard, int centerRow, int centerCol, Board playerBoard)`:

1. Compute 5 target cells: center + 4 diagonals `(row±1, col±1)`
2. Filter out-of-bounds cells (row/col outside 0-9)
3. Filter cells already hit (duplicate shot check)
4. For each valid cell, resolve shot:
   - Iterate opponent's ships → check cell overlap → HIT/MISS/SUNK
   - Create Shot entity, add to opponentBoard.getShots()
   - If HIT on armored ship: check if Armament triggers. If it does AND playerBoard's `opponentSkipTurns > 0` (Conqueror's window active), **subtract 1** from playerBoard's `opponentSkipTurns` instead of adding to defender's opponentSkipTurns ("eats one skip turn")
5. Check win condition after all X-pattern shots resolve (if all ships sunk → game over)
6. Return `List<XPatternShotResult>`

Note: The X-pattern does NOT replace the normal shot. The player ALSO fires via `fireShot` after activation (per spec "you still fire your shot"). The X-pattern fires on the 4 DIAGONAL cells only. The center cell is left for the player's normal `fireShot` call. This avoids the 5+1=6 problem and aligns with "you still fire your shot" for ALL levels uniformly.

**REVISED INTERPRETATION**: X-pattern fires the 4 diagonals during activation. The center cell is the player's normal shot (fired via regular `fireShot`). Total = 5 cells (4 diagonals + 1 center via normal shot). This is consistent with "5 total cells hit" and "you still fire your shot."

### 7. Modify HakiBattleService — cooldown handling

New method `decrementConquerorsCooldown(UUID boardId)`:
```java
@Transactional
public void decrementConquerorsCooldown(UUID boardId) {
    hakiBattleStateRepository.findByBoardId(boardId).ifPresent(state -> {
        if (state.getConquerorsCooldownTurns() > 0 && state.getOpponentSkipTurns() == 0) {
            state.setConquerorsCooldownTurns(state.getConquerorsCooldownTurns() - 1);
            hakiBattleStateRepository.save(state);
        }
    });
}
```

Cooldown starts when the last skip turn is consumed (opponentSkipTurns hits 0). Decrement happens each time the Conqueror's user's turn starts (in `resetHakiUsedThisTurn` is the wrong place — it's called for the NEW turn owner, not necessarily the Conqueror's user).

**Better approach**: Extend `consumeSkipTurn` — when `opponentSkipTurns` decrements to 0, SET the cooldown:
```java
if (state.getOpponentSkipTurns() == 0) {
    // Skip window just ended. Set cooldown based on last use.
    // conquerorsUsesConsumed tracks which use was last.
    // If conquerorsUsesConsumed == 1 (just used weak): cooldown = 1
    // If conquerorsUsesConsumed == 2 (just used strong/awakened): cooldown = 2
    if (state.getConquerorsLevel() > 0 && state.getConquerorsUsesConsumed() > 0) {
        int lastSkipAmount = ... // need to know if last was weak or strong
    }
}
```

**SIMPLEST approach**: Set cooldown immediately at activation time. The cooldown doesn't START counting down until the skip window ends. Track via: decrement cooldown in `resetHakiUsedThisTurn` ONLY when `opponentSkipTurns == 0`. Since `resetHakiUsedThisTurn` is called for the player who is ABOUT to receive a turn (opponent's board), we need to call it for the Conqueror's user specifically.

**FINAL approach**: 
- At activation: store the cooldown value in a new "pending cooldown" sense. Use `conquerorsCooldownTurns` for this.
- Actually simpler: DON'T set cooldown at activation. Instead, modify `consumeSkipTurn`: when `opponentSkipTurns` goes from 1→0 (last skip consumed), set `conquerorsCooldownTurns` based on what level of use was last consumed (if `conquerorsUsesConsumed == 1` and `conquerorsLevel >= 1`, cooldown = 1; if `conquerorsUsesConsumed == 2`, cooldown = 2).
- Decrement cooldown: In BoardService's turn-switch logic, after the turn switches normally (no skip consumed), call `hakiBattleService.decrementConquerorsCooldown(playerBoard.getId())` — this decrements the Conqueror's user's cooldown when they fire and miss (turn switches away). This ensures cooldown ticks per normal turn cycle.

**REFINED FINAL**: 
- When the LAST skip turn is consumed (inside `consumeSkipTurn`, after decrement, if new value == 0): set `conquerorsCooldownTurns` = 1 (if the most recent activation was WEAK i.e. added 3 skips) or 2 (if STRONG/AWAKENED i.e. added 5 skips). To know which: add a field `conquerorsLastSkipAmount` or derive from `conquerorsUsesConsumed`. Since uses are consumed sequentially (first = weak, second = strong/awakened for Lv2/3), we can derive: if `conquerorsUsesConsumed == 1` → last was weak → cooldown 1. If `conquerorsUsesConsumed == 2` → last was strong/awakened → cooldown 2.
- Cooldown decrements: Each time a full turn cycle completes for the Conqueror's user (they fire, turn goes to opponent, opponent fires, turn comes back to them). Simplest approximation: decrement when `resetHakiUsedThisTurn` is called for the Conqueror's board AND `opponentSkipTurns == 0`. This happens each time the Conqueror's user gets a new turn.

**IMPLEMENTATION DECISION**: Decrement cooldown inside `resetHakiUsedThisTurn`:
```java
@Transactional
public void resetHakiUsedThisTurn(UUID boardId) {
    hakiBattleStateRepository.findByBoardId(boardId).ifPresent(state -> {
        state.setHakiUsedThisTurn(false);
        // Decrement Conqueror's cooldown when this player starts a new normal turn
        if (state.getConquerorsCooldownTurns() > 0 && state.getOpponentSkipTurns() == 0) {
            state.setConquerorsCooldownTurns(state.getConquerorsCooldownTurns() - 1);
        }
        hakiBattleStateRepository.save(state);
    });
}
```

But `resetHakiUsedThisTurn` is called for the OPPONENT's board when turn switches to them (BoardService line 272: after MISS, reset the opponent's haki flag). So it's called when the opponent STARTS their turn. For cooldown to decrement per Conqueror's-user's-turn, we need to decrement when resetHakiUsedThisTurn is called for the Conqueror's user's own board.

Looking at BoardService: After a MISS by attacker → `game.setCurrentTurn(opponentBoard.getOwner())` → `resetHakiUsedThisTurn(opponentBoard.getId())`. So it resets the NEW turn holder's haki flag. If skip consumed → turn goes BACK to attacker → `resetHakiUsedThisTurn(playerBoard.getId())`. 

So `resetHakiUsedThisTurn` is called for whoever is ABOUT TO take their turn. If the Conqueror's user is about to take a normal turn (opponentSkipTurns == 0 on their state), decrement their cooldown. This works perfectly — place the cooldown decrement inside `resetHakiUsedThisTurn`.

### 8. Modify HakiBattleService — consumeSkipTurn (set cooldown when skips exhausted)

Modify `consumeSkipTurn`:
```java
@Transactional
public boolean consumeSkipTurn(Board defenderBoard) {
    HakiBattleState state = hakiBattleStateRepository.findByBoardId(defenderBoard.getId())
            .orElse(null);

    if (state != null && state.getOpponentSkipTurns() > 0) {
        state.setOpponentSkipTurns(state.getOpponentSkipTurns() - 1);
        
        // If skip window just ended, set Conqueror's cooldown
        if (state.getOpponentSkipTurns() == 0 && state.getConquerorsLevel() > 0 && state.getConquerorsUsesConsumed() > 0) {
            int cooldown = (state.getConquerorsUsesConsumed() == 1) ? 1 : 2;
            state.setConquerorsCooldownTurns(cooldown);
        }
        
        hakiBattleStateRepository.save(state);
        return true;
    }
    return false;
}
```

### 9. Modify HakiBattleService — Armament "eats skip turn" during Conqueror's window

Modify `checkArmamentTrigger` to accept the attacker's board and check if the Conqueror's window is active on the attacker's side:

Current signature: `checkArmamentTrigger(Board defenderBoard, Ship hitShip, int hitRow, int hitCol, Board attackerBoard)`

Add logic: when Armament triggers and `attackerBoard`'s state has `opponentSkipTurns > 0` (meaning the defender owes skips = Conqueror's window active for attacker), subtract 1 from attacker's `opponentSkipTurns` instead of adding to defender's `opponentSkipTurns`:

```java
// Inside checkArmamentTrigger, after determining trigger:
HakiBattleState attackerState = hakiBattleStateRepository.findByBoardId(attackerBoard.getId()).orElse(null);
if (attackerState != null && attackerState.getOpponentSkipTurns() > 0) {
    // Conqueror's window active — "eat" one skip turn
    attackerState.setOpponentSkipTurns(attackerState.getOpponentSkipTurns() - 1);
    hakiBattleStateRepository.save(attackerState);
} else {
    // Normal Armament behavior — opponent (attacker) owes a skip
    state.setOpponentSkipTurns(state.getOpponentSkipTurns() + 1);
}
```

This replaces the current `state.setOpponentSkipTurns(state.getOpponentSkipTurns() + 1)` in both ship1 and ship2 trigger branches.

### 10. Modify BoardService — cooldown decrement integration

No explicit change needed beyond step 7's modification to `resetHakiUsedThisTurn` — that method already exists and is called at the right time by BoardService.

### 11. Add SSE event

**GameEvent.java** — add constant:
```java
public static final String CONQUERORS_HAKI_USED = "CONQUERORS_HAKI_USED";
```

**GameEventEmitter.java** — add method:
```java
public void emitConquerorsHakiUsed(String gameToken, UUID opponentId, int skipTurns, String effectLevel) {
    long id = registry.nextEventId(gameToken);
    GameEvent event = GameEvent.of(id, GameEvent.CONQUERORS_HAKI_USED, Map.of(
        "skipTurns", skipTurns,
        "effectLevel", effectLevel
    ));
    registry.send(gameToken, opponentId, event);
}
```

### 12. Add API endpoint

**GameController.java** — add:
```java
@PostMapping("/{token}/haki/conquerors")
public ConquerorsActivationResponse useConquerorsHaki(@PathVariable String token,
                                                      @RequestBody ConquerorsActivationRequest request,
                                                      @AuthenticationPrincipal AuthenticatedUser principal) {
    return hakiBattleService.activateConquerors(token, principal.getId(), request);
}
```

### 13. Unit tests — HakiConquerorsServiceTest

Create dedicated test class with tests:
1. `activateConquerors_lv1_weak_setsSkip3` — happy path Lv1
2. `activateConquerors_lv2_weak_thenStrong` — two sequential uses
3. `activateConquerors_lv3_awakened_firesXPattern` — X-pattern resolves 4 diagonals
4. `activateConquerors_lv3_awakened_xPatternOutOfBounds` — corner center, only valid diagonals fire
5. `activateConquerors_failsWhenNotYourTurn` — 409
6. `activateConquerors_failsWhenHakiAlreadyUsed` — 400
7. `activateConquerors_failsWhenNoUsesRemaining` — 400
8. `activateConquerors_failsWhenOnCooldown` — 400
9. `activateConquerors_failsWhenNotUnlocked` — 400
10. `activateConquerors_failsWhenGameNotInProgress` — 400
11. `activateConquerors_lv3_awakened_requiresRowCol` — 400 when no coords
12. `consumeSkipTurn_setsCooldownWhenSkipsExhausted_weak` — cooldown = 1 after weak
13. `consumeSkipTurn_setsCooldownWhenSkipsExhausted_strong` — cooldown = 2 after strong
14. `resetHakiUsedThisTurn_decrementsCooldown` — cooldown goes from 2→1→0
15. `resetHakiUsedThisTurn_noCooldownDecrementDuringSkipWindow` — opponentSkipTurns > 0 blocks decrement
16. `armamentTrigger_eatsSkipTurn_duringConquerorsWindow` — attacker's opponentSkipTurns reduced by 1
17. `armamentTrigger_normalBehavior_outsideConquerorsWindow` — defender's opponentSkipTurns increased
18. `initializeForBoard_setsConquerorsUsesBasedOnLevel` — Lv1→1, Lv2→2, Lv3→2
19. `activateConquerors_xPattern_triggersArmament_eatsSkip` — X-pattern hit on armored ship eats skip
20. `activateConquerors_xPattern_skipsDuplicateShots` — already-hit cells skipped
21. `activateConquerors_xPattern_checksWinCondition` — if all ships sunk by X-pattern → game ends

### 14. Modify BoardServiceFireShotTest

Add 2-3 integration tests:
1. `fireShot_duringConquerorsWindow_turnStaysWithAttacker` — after Conqueror's activation, attacker fires and misses, consumeSkipTurn keeps them firing
2. `fireShot_conquerorsCooldownDecrementsAfterNormalTurnSwitch` — after skip window ends, cooldown ticks down

## Verification

```bash
# 1. Full compilation
cd service && mvn compile -q

# 2. Full test suite (must include new + existing tests all green)
cd service && mvn test

# 3. Targeted new test class
cd service && mvn test -Dtest=HakiConquerorsServiceTest

# 4. Targeted fire-shot integration tests
cd service && mvn test -Dtest=BoardServiceFireShotTest

# 5. Client still builds (no client changes)
cd client && npm run build

# 6. Verify migration file exists
grep -l "conquerors_cooldown_turns" service/src/main/resources/db/migration/V14*.sql

# 7. Verify SSE event constant
grep "CONQUERORS_HAKI_USED" service/src/main/java/com/last_island/api/infrastructure/sse/GameEvent.java

# 8. Verify endpoint exists
grep "haki/conquerors" service/src/main/java/com/last_island/api/domain/game/controller/GameController.java

# 9. Verify no leftover TODOs in new code
grep -rn "TODO\|FIXME" service/src/main/java/com/last_island/api/domain/haki/dto/Conquerors*.java service/src/main/java/com/last_island/api/domain/haki/dto/XPattern*.java
```

## Rollback

```bash
# Remove created files
rm -f service/src/main/resources/db/migration/V14__add_conquerors_fields_to_haki_battle_state.sql
rm -f service/src/main/java/com/last_island/api/domain/haki/dto/ConquerorsActivationRequest.java
rm -f service/src/main/java/com/last_island/api/domain/haki/dto/ConquerorsActivationResponse.java
rm -f service/src/main/java/com/last_island/api/domain/haki/dto/XPatternShotResult.java
rm -f service/src/test/java/com/last_island/api/domain/haki/service/HakiConquerorsServiceTest.java

# Restore modified files
git checkout -- \
  service/src/main/java/com/last_island/api/domain/haki/entity/HakiBattleState.java \
  service/src/main/java/com/last_island/api/domain/haki/service/HakiBattleService.java \
  service/src/main/java/com/last_island/api/domain/board/service/BoardService.java \
  service/src/main/java/com/last_island/api/domain/game/controller/GameController.java \
  service/src/main/java/com/last_island/api/infrastructure/sse/GameEvent.java \
  service/src/main/java/com/last_island/api/infrastructure/sse/GameEventEmitter.java \
  service/src/test/java/com/last_island/api/domain/board/service/BoardServiceFireShotTest.java
```
