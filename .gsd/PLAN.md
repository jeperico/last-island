# Allow fleet redeployment during PLACING_SHIPS phase

## Objective

Allow players to redeploy their fleet (clear + re-place ships) while the game is still in PLACING_SHIPS phase, with a "Redeploy Fleet" button on the waiting screen.

## Files to touch

- modify `service/src/main/java/com/last_island/api/domain/board/service/BoardService.java` — replace 409 throw with `board.getShips().clear()`
- modify `service/src/test/java/com/last_island/api/domain/board/service/BoardServicePlaceShipsTest.java` — rewrite `placeShips_fleetAlreadyDeployed_rejects` to assert successful redeployment
- modify `client/src/app/game/[token]/page.tsx` — add `isRedeploying` state and "Redeploy Fleet" button on the waiting screen

## Steps

1. In `BoardService.java` (lines 73–76), replace the `if (!board.getShips().isEmpty())` block that throws `ResponseStatusException(HttpStatus.CONFLICT, "Fleet already deployed")` with `board.getShips().clear()` — orphanRemoval on the Board→Ship relationship handles DB deletion.

2. In `BoardServicePlaceShipsTest.java`, rename `placeShips_fleetAlreadyDeployed_rejects` to `placeShips_fleetAlreadyDeployed_clearsAndRedeploys` and rewrite it to:
   - Set up a board with an existing ship (as before).
   - Call `boardService.placeShips(...)` with a valid full fleet.
   - Assert no exception is thrown.
   - Assert `board.getShips().size() == 5` (old ship cleared, new fleet placed).
   - Assert old ship type is not present if it wasn't in the new fleet (or verify all 5 new types are present).

3. In `client/src/app/game/[token]/page.tsx`, in the PLACING_SHIPS section:
   - Add a `const [isRedeploying, setIsRedeploying] = useState(false)` state variable near the top of the component (with other state).
   - Change the condition that shows `ShipPlacement` from `if (!hasPlacedShips)` to `if (!hasPlacedShips || isRedeploying)`.
   - Wrap `handlePlacementComplete` or create a new wrapper that also calls `setIsRedeploying(false)` after placement succeeds.
   - In the "Fleet deployed, Captain!" waiting screen, add a "Redeploy Fleet" button (styled consistently with existing buttons) that calls `setIsRedeploying(true)`. Place it below the "Opponent preparing fleet…" status pill.

## Verification

```bash
make service-test
make client-build
make client-lint
```

- `service-test`: all tests green, including the rewritten redeployment test.
- `client-build`: TypeScript compiles with no errors.
- `client-lint`: no new lint errors introduced.
- Manual grep: `grep -r "Fleet already deployed" service/src/main/` returns 0 results.

## Rollback

```bash
git checkout -- service/src/main/java/com/last_island/api/domain/board/service/BoardService.java
git checkout -- service/src/test/java/com/last_island/api/domain/board/service/BoardServicePlaceShipsTest.java
git checkout -- client/src/app/game/\[token\]/page.tsx
```
