# Add WO (Walkover/Surrender) Mechanic

## Objective

Allow a player to surrender during an active battle, resulting in an automatic loss (WO). The opponent wins by walkover. This works from any in-game phase (PLACING_SHIPS or IN_PROGRESS). Backend provides a surrender endpoint; frontend shows a surrender button and a confirmation modal.

## Files to touch

### Backend
- **modify** `service/src/main/java/com/last_island/api/domain/game/service/GameService.java` — add `surrender(token, userId)` method
- **modify** `service/src/main/java/com/last_island/api/domain/game/controller/GameController.java` — add `POST /games/{token}/surrender` endpoint
- **modify** `service/src/main/java/com/last_island/api/infrastructure/sse/GameEventEmitter.java` — add `emitSurrender(token, surrenderedPlayerName)` method
- **modify** `service/src/main/java/com/last_island/api/infrastructure/sse/GameEvent.java` — add `SURRENDER` constant
- **create** `service/src/test/java/com/last_island/api/domain/game/service/GameServiceSurrenderTest.java` — unit tests

### Frontend
- **add** `surrender()` function to `client/src/lib/api/games.ts`
- **modify** `client/src/types/game-events.ts` — add SURRENDER event type
- **create** `client/src/components/surrender-modal.tsx` — confirmation modal ("Are you sure you want to surrender?")
- **modify** `client/src/app/game/[token]/battle-screen.tsx` — add surrender button + modal
- **modify** `client/src/app/game/[token]/ship-placement.tsx` — add surrender button + modal
- **modify** `client/src/app/game/[token]/page.tsx` — handle SURRENDER SSE event (refetch game state → shows game over)
- **modify** `client/src/lib/game/use-game-events.ts` — add SURRENDER event listener

## Steps

### Backend

1. **GameEvent.java**: Add `public static final String SURRENDER = "SURRENDER";`

2. **GameEventEmitter.java**: Add method:
   ```java
   public void emitSurrender(String gameToken, UUID targetPlayerId, String surrenderedPlayerName) {
       long id = registry.nextEventId(gameToken);
       GameEvent event = GameEvent.of(id, GameEvent.SURRENDER, Map.of("surrenderedPlayerName", surrenderedPlayerName));
       registry.send(gameToken, targetPlayerId, event);
   }
   ```

3. **GameService.java**: Add `surrender` method:
   - Fetch game by token (active)
   - Validate user is participant
   - Validate phase is PLACING_SHIPS or IN_PROGRESS
   - Set phase to FINISHED, endedAt = now()
   - Determine winner (opponent) and loser (surrendering player)
   - Create GameResult (winner, loser, turns)
   - Update wins/losses on users
   - Emit SURRENDER event to opponent after commit
   - Return void or GameResponse

4. **GameController.java**: Add endpoint:
   ```java
   @PostMapping("/{token}/surrender")
   public void surrender(@PathVariable String token, @AuthenticationPrincipal AuthenticatedUser principal) {
       gameService.surrender(token, principal.getId());
   }
   ```

5. **Tests**: GameServiceSurrenderTest with cases:
   - Happy path: IN_PROGRESS game, surrendering player loses
   - Happy path: PLACING_SHIPS game, surrendering player loses
   - Reject: game FINISHED already → 400
   - Reject: not a participant → 403
   - Verify GameResult created with correct winner/loser
   - Verify wins/losses updated

### Frontend

6. **API function**: Add `surrender(token)` to `games.ts`:
   ```ts
   export function surrender(token: string): Promise<void> {
     return apiPost<void>(`/api/games/${token}/surrender`);
   }
   ```

7. **SSE event type**: Add `SURRENDER` to game-events.ts, with `SurrenderEventData { surrenderedPlayerName: string }`, add `onSurrender` handler.

8. **use-game-events.ts**: Add `SURRENDER` event listener that calls `handlersRef.current.onSurrender?.(data)`.

9. **SurrenderModal component**: A confirmation modal using the existing `Modal` component:
   - "🏳️ Surrender?" title
   - "This battle will be recorded as a defeat. Your opponent wins by walkover." description
   - Two buttons: "Cancel" (secondary) and "Surrender" (danger/red, loading state)
   - Props: `open`, `onClose`, `onConfirm`, `loading`

10. **BattleScreen**: Add a "🏳️ Surrender" button (small, secondary/danger variant) in the bottom area. Clicking opens SurrenderModal. On confirm, calls `surrender(gameToken)`.

11. **ShipPlacement**: Add a similar "🏳️ Surrender" button near the action buttons.

12. **Game page (page.tsx)**: Add `onSurrender` handler to `useGameEvents` that calls `refetchGame()` — the refetch will get FINISHED state and render game-over panel.

## Verification

```bash
cd service && ./mvnw clean verify -q
cd client && npm run build
cd client && npm run lint
```

## Rollback

```bash
git checkout -- service/src/main/java/com/last_island/api/domain/game/service/GameService.java \
  service/src/main/java/com/last_island/api/domain/game/controller/GameController.java \
  service/src/main/java/com/last_island/api/infrastructure/sse/GameEventEmitter.java \
  service/src/main/java/com/last_island/api/infrastructure/sse/GameEvent.java \
  client/src/lib/api/games.ts \
  client/src/types/game-events.ts \
  client/src/lib/game/use-game-events.ts \
  client/src/app/game/\[token\]/battle-screen.tsx \
  client/src/app/game/\[token\]/ship-placement.tsx \
  client/src/app/game/\[token\]/page.tsx
rm -f service/src/test/java/com/last_island/api/domain/game/service/GameServiceSurrenderTest.java \
  client/src/components/surrender-modal.tsx
```
