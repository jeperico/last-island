# Plan: Observation Haki Backend

## Objective

Implement the Observation Haki battle ability: DB migration for HakiBattleState, entity/repository, DTOs, service logic with level-based reveal (2×2 weak / 3×3 strong / 3×3+row/col awakened), initialization on game start, SSE notification, API endpoint, and comprehensive unit tests.

## Files to touch

- **create** `service/src/main/resources/db/migration/V12__create_haki_battle_state.sql`
- **create** `service/src/main/java/com/last_island/api/domain/haki/entity/HakiBattleState.java`
- **create** `service/src/main/java/com/last_island/api/domain/haki/repository/HakiBattleStateRepository.java`
- **create** `service/src/main/java/com/last_island/api/domain/haki/dto/ObservationRequest.java`
- **create** `service/src/main/java/com/last_island/api/domain/haki/dto/ObservationResponse.java`
- **create** `service/src/main/java/com/last_island/api/domain/haki/dto/RevealedCell.java`
- **create** `service/src/main/java/com/last_island/api/domain/haki/enums/CellRevealStatus.java`
- **create** `service/src/main/java/com/last_island/api/domain/haki/service/HakiBattleService.java`
- **create** `service/src/test/java/com/last_island/api/domain/haki/service/HakiBattleServiceTest.java`
- **modify** `service/src/main/java/com/last_island/api/infrastructure/sse/GameEvent.java` — add `OBSERVATION_HAKI_USED` constant
- **modify** `service/src/main/java/com/last_island/api/infrastructure/sse/GameEventEmitter.java` — add `emitObservationHakiUsed` method
- **modify** `service/src/main/java/com/last_island/api/domain/board/service/BoardService.java` — inject HakiBattleService, call `initializeHakiBattleStates` on IN_PROGRESS transition
- **modify** `service/src/main/java/com/last_island/api/domain/game/controller/GameController.java` — add `POST /{token}/haki/observation` endpoint

## Steps

1. **Create V12 migration** — `haki_battle_state` table with columns: `id UUID PK`, `board_id UUID FK NOT NULL REFERENCES boards(id)`, `observation_uses_remaining INT NOT NULL DEFAULT 0`, `observation_uses_consumed INT NOT NULL DEFAULT 0`, `observation_level INT NOT NULL DEFAULT 0`, `conquerors_uses_remaining INT NOT NULL DEFAULT 0` (placeholder for future plans), `haki_used_this_turn BOOLEAN NOT NULL DEFAULT FALSE`, `created_at`, `updated_at`, `is_active`. Add UNIQUE constraint on `board_id`.

2. **Create HakiBattleState entity** — extends BaseEntity, fields: `boardId` (UUID, FK to boards), `observationUsesRemaining` (int), `observationUsesConsumed` (int), `observationLevel` (int, snapshot of player's level at game start), `conquerorsUsesRemaining` (int, default 0), `hakiUsedThisTurn` (boolean). Follow Lombok @Data/@Builder/@Entity pattern from HakiProfile.

3. **Create HakiBattleStateRepository** — `JpaRepository<HakiBattleState, UUID>` with `Optional<HakiBattleState> findByBoardId(UUID boardId)`.

4. **Create CellRevealStatus enum** — values: `HAS_SHIP`, `EMPTY`.

5. **Create RevealedCell record** — `record RevealedCell(int row, int col, CellRevealStatus status)`.

6. **Create ObservationRequest record** — `record ObservationRequest(int row, int col, String awakened)`. The `awakened` field is optional (nullable), used only for Lv3 second use: value is `"ROW"` or `"COL"` + the index. Simplify: `record ObservationRequest(int row, int col, Integer revealRowIndex, Integer revealColIndex)` — if Lv3 awakened, exactly one of `revealRowIndex`/`revealColIndex` must be non-null.

7. **Create ObservationResponse record** — `record ObservationResponse(List<RevealedCell> revealedCells, String effectLevel)`. `effectLevel` is `"WEAK"`, `"STRONG"`, or `"AWAKENED"`.

8. **Create HakiBattleService** with constructor injection of `HakiBattleStateRepository`, `HakiProfileRepository`, `GameRepository`, `GameEventEmitter`:

   a. **`initializeHakiBattleStates(Game game)`** — called when game transitions to IN_PROGRESS. For each board (blue/red): look up the board owner's HakiProfile, compute `observationUsesRemaining` based on `observationLevel` (Lv0=0, Lv1=1, Lv2=2, Lv3=2), snapshot `observationLevel`, save HakiBattleState.

   b. **`activateObservation(String token, UUID userId, ObservationRequest request)`** — main method:
      - Fetch game by token, validate phase = IN_PROGRESS
      - Identify player/opponent boards (same pattern as BoardService.fireShot)
      - Validate it's the player's turn (`game.getCurrentTurn().getId().equals(userId)`)
      - Fetch player's HakiBattleState by boardId
      - Validate `hakiUsedThisTurn == false` (one Haki per turn)
      - Validate `observationLevel > 0` (has Observation unlocked)
      - Validate `observationUsesRemaining > 0`
      - Determine effect level: if `observationUsesConsumed == 0` → WEAK (2×2); if `observationUsesConsumed == 1` and `observationLevel == 2` → STRONG (3×3); if `observationUsesConsumed == 1` and `observationLevel == 3` → AWAKENED (3×3 + row/col)
      - Validate top-left corner bounds: for WEAK, `row+1 <= 9 && col+1 <= 9`; for STRONG/AWAKENED, `row+2 <= 9 && col+2 <= 9`
      - For AWAKENED: validate exactly one of `revealRowIndex`/`revealColIndex` is provided and in range [0,9]
      - Compute revealed cells: iterate area cells, check opponent board ships to determine HAS_SHIP vs EMPTY
      - For AWAKENED: additionally reveal entire row or column
      - Decrement `observationUsesRemaining`, increment `observationUsesConsumed`, set `hakiUsedThisTurn = true`
      - Save HakiBattleState
      - Emit SSE to opponent (no location info)
      - Return ObservationResponse

   c. **`resetHakiUsedThisTurn(UUID boardId)`** — public method to reset `hakiUsedThisTurn = false`. Called from BoardService when turn switches (on MISS and on turn expiration). Also needed when the player's turn starts.

9. **Add SSE event constant** — in GameEvent.java add `public static final String OBSERVATION_HAKI_USED = "OBSERVATION_HAKI_USED";`

10. **Add emitObservationHakiUsed method** — in GameEventEmitter: `emitObservationHakiUsed(String gameToken, UUID opponentId)` sends event with type `OBSERVATION_HAKI_USED` and empty data (no location).

11. **Modify BoardService** — inject `HakiBattleService`:
    - In `placeShips`, after `game.setPhase(GamePhase.IN_PROGRESS)` (line ~143-147): call `hakiBattleService.initializeHakiBattleStates(game)`
    - In `fireShot`, after turn switches (on MISS, line ~261): call `hakiBattleService.resetHakiUsedThisTurn(opponentBoard.getId())` to reset the new active player's haki-used flag. Also reset on HIT/SUNK continuation: no reset needed (same player continues, they already used or didn't use haki this turn).
    - Actually, simpler approach: reset `hakiUsedThisTurn` at the START of the observation activation check is wrong. The flag persists for the turn duration. Reset must happen when a NEW turn begins for a player. The cleanest place: when turn switches in fireShot (MISS case) → reset the NEXT player's `hakiUsedThisTurn`. Also in GameExpirationService when turn expires → same reset.

12. **Add endpoint to GameController** — `POST /{token}/haki/observation`:
    ```java
    @PostMapping("/{token}/haki/observation")
    public ObservationResponse useObservationHaki(@PathVariable String token,
                                                  @RequestBody ObservationRequest request,
                                                  @AuthenticationPrincipal AuthenticatedUser principal) {
        return hakiBattleService.activateObservation(token, principal.getId(), request);
    }
    ```

13. **Write HakiBattleServiceTest** — test scenarios:
    - `lv1_singleUse_reveals2x2` — use once, get 4 cells (2×2), verify HAS_SHIP/EMPTY correctness
    - `lv1_secondUseRejected` — after 1 use, second call → 400 BAD REQUEST
    - `lv2_firstUseWeak_secondUseStrong` — first use → 2×2 (4 cells), second use → 3×3 (9 cells)
    - `lv2_thirdUseRejected` — after 2 uses → 400
    - `lv3_firstUseWeak_secondUseAwakened` — first → 2×2, second → 3×3 + full row (19 cells max, deduplicated)
    - `lv3_awakenedWithColumn` — second use reveals 3×3 + full column
    - `lv3_awakenedMissingRowCol` — second use without revealRowIndex/revealColIndex → 400
    - `notYourTurn_409` — call when currentTurn ≠ userId → 409 CONFLICT
    - `hakiAlreadyUsedThisTurn_400` — flag true → 400
    - `observationLevelZero_400` — no observation unlocked → 400
    - `noUsesRemaining_400` — uses remaining = 0 → 400
    - `outOfBounds_weak_400` — row=9, col=9 for 2×2 → out of bounds → 400
    - `outOfBounds_strong_400` — row=8, col=8 for 3×3 → out of bounds → 400
    - `revealCorrectlyIdentifiesShipCells` — place ships on opponent board, verify cell status matches
    - `sseEmittedToOpponent` — verify GameEventEmitter.emitObservationHakiUsed called with opponent's ID
    - `initializesCorrectly_lv1` — after init, uses_remaining=1, level=1
    - `initializesCorrectly_lv2` — after init, uses_remaining=2, level=2
    - `initializesCorrectly_lv3` — after init, uses_remaining=2, level=3
    - `initializesCorrectly_lv0` — after init, uses_remaining=0, level=0
    - `resetHakiUsedThisTurn_clearsFlag` — verify flag goes from true to false

## Verification

```bash
cd service && mvn compile
cd service && mvn test
cd service && mvn test -pl . -Dtest=HakiBattleServiceTest
grep -r "HakiBattleState" service/src/main/
grep -r "OBSERVATION_HAKI_USED" service/src/
grep -r "observation" service/src/test/java/
```

All tests (96+ existing + new HakiBattleServiceTest) must pass. Compilation must succeed with no errors. Grep confirms entity references and test coverage.

## Rollback

```bash
git checkout -- service/src/main/java/com/last_island/api/domain/haki/
git checkout -- service/src/main/java/com/last_island/api/infrastructure/sse/GameEvent.java
git checkout -- service/src/main/java/com/last_island/api/infrastructure/sse/GameEventEmitter.java
git checkout -- service/src/main/java/com/last_island/api/domain/board/service/BoardService.java
git checkout -- service/src/main/java/com/last_island/api/domain/game/controller/GameController.java
git checkout -- service/src/test/java/com/last_island/api/domain/haki/service/HakiBattleServiceTest.java
rm -f service/src/main/resources/db/migration/V12__create_haki_battle_state.sql
```
