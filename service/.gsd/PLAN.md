# SSE Real-Time Event Integration in Last Island Client

## Objective

Replace all polling intervals in the game screens with a reusable SSE hook (`useGameEvents`) that connects to the backend's event stream and reactively updates UI on CONNECTED, OPPONENT_JOINED, SHIPS_PLACED, SHOT_RECEIVED, and GAME_OVER events.

## Files to touch

- **create** `client/src/types/game-events.ts` — TypeScript types for all SSE event payloads
- **create** `client/src/lib/game/use-game-events.ts` — Reusable React hook wrapping EventSource
- **modify** `client/src/lib/game/index.ts` — Re-export the new hook
- **modify** `client/src/types/index.ts` — Re-export game-events types (if barrel exists; otherwise add to existing barrel)
- **modify** `client/src/app/game/[token]/page.tsx` — Subscribe to SSE, remove 5s polling interval, handle OPPONENT_JOINED/SHIPS_PLACED/GAME_OVER
- **modify** `client/src/app/game/[token]/battle-screen.tsx` — Remove 3s polling interval, accept SSE-driven state updates from parent

## Steps

1. **Create SSE event types** (`client/src/types/game-events.ts`):
   ```ts
   import type { ShotResult } from "./game";

   export type GameEventType =
     | "CONNECTED"
     | "OPPONENT_JOINED"
     | "SHIPS_PLACED"
     | "SHOT_RECEIVED"
     | "GAME_OVER";

   export interface ConnectedEventData {}

   export interface OpponentJoinedEventData {
     joinerName: string;
   }

   export interface ShipsPlacedEventData {
     gameStarted?: boolean;
   }

   export interface ShotReceivedEventData {
     row: number;
     col: number;
     result: ShotResult;
     isMyTurn: boolean;
     sunkShipType?: string | null;
   }

   export interface GameOverEventData {
     winnerName: string;
   }

   export interface GameEventHandlers {
     onConnected?: (data: ConnectedEventData) => void;
     onOpponentJoined?: (data: OpponentJoinedEventData) => void;
     onShipsPlaced?: (data: ShipsPlacedEventData) => void;
     onShotReceived?: (data: ShotReceivedEventData) => void;
     onGameOver?: (data: GameOverEventData) => void;
     onError?: (error: Event) => void;
   }
   ```

2. **Create `useGameEvents` hook** (`client/src/lib/game/use-game-events.ts`):
   - Mark `"use client"`.
   - Accept `gameToken: string`, `handlers: GameEventHandlers`, `enabled: boolean` (default true).
   - On mount (when enabled), read JWT via `getAccessToken()`.
   - Construct EventSource URL using `NEXT_PUBLIC_API_URL` env var + `/games/{token}/events?token={jwt}`. Use the absolute URL from the env var (NOT the proxy path) to avoid Next.js rewrite buffering SSE streams.
   - Register named event listeners for each event type (`es.addEventListener("CONNECTED", ...)`). Parse `event.data` as JSON, call typed handler.
   - On `onerror`, call `onError` handler. If token is null (expired), close EventSource.
   - On unmount or when `enabled` becomes false, call `es.close()` and remove listeners.
   - Use `useRef` for the EventSource instance and `useRef` for handlers (to avoid re-opening connections when handler references change).
   - Use a `useEffect` with deps `[gameToken, enabled]` to open/close connection.
   - Return `{ connected: boolean }` state that flips to `true` on CONNECTED event.

3. **Re-export hook from game barrel** (`client/src/lib/game/index.ts`):
   - Add `export { useGameEvents } from "./use-game-events";`

4. **Re-export types** — add `export * from "./game-events";` to `client/src/types/index.ts` (verify barrel exists first; if not, the types import via `@/types/game-events` directly).

5. **Integrate into `page.tsx`** (`client/src/app/game/[token]/page.tsx`):
   - Import `useGameEvents` from `@/lib/game` and `getGame` (already imported).
   - Remove the entire second `useEffect` (lines 54–70, the 5s polling interval).
   - Add `useGameEvents(token, { ... }, enabled)` with handlers:
     - `onConnected`: no-op (or set a "connected" indicator).
     - `onOpponentJoined`: call `refetchGame()` — this transitions phase from WAITING_OPPONENT to PLACING_SHIPS.
     - `onShipsPlaced`: call `refetchGame()` — if `data.gameStarted`, this transitions phase to IN_PROGRESS.
     - `onShotReceived`: call `refetchGame()` — updates myBoard shots received and turn indicator.
     - `onGameOver`: call `refetchGame()` — transitions to FINISHED phase.
     - `onError`: optionally set an error state or silently ignore (EventSource auto-reconnects).
   - Enable the hook only when `gameState !== null && gameState.phase !== "FINISHED"` (no need for events on a finished game).
   - The `refetchGame()` approach is intentionally simple: each SSE event triggers a full state refetch to keep the UI in sync without partial state management. This is idempotent and safe against race conditions.

6. **Remove polling from `battle-screen.tsx`** (`client/src/app/game/[token]/battle-screen.tsx`):
   - Delete the `pollingRef` declaration (line 30).
   - Delete the entire polling `useEffect` (lines 47–69).
   - Remove the `getGame` import if no longer used elsewhere in the file.
   - The component now relies entirely on the parent pushing updated `gameState` props (via `onGameStateUpdate`) which the parent does when SSE events arrive.
   - Keep the `handleFire` function's existing behavior of refetching after a successful shot (attacker still needs immediate feedback from their own action via REST).

7. **Verify no remaining polling references**:
   - Grep for `setInterval` in `client/src/app/game/` — should return 0 matches.
   - Grep for `5000` and `3000` timeouts in game files — should return 0 matches.

## Verification

```bash
# 1. TypeScript compilation (no errors)
cd /home/perico/work/last-island/client && npx tsc --noEmit

# 2. Full Next.js production build (verifies no SSR issues with EventSource)
cd /home/perico/work/last-island/client && npm run build

# 3. Confirm no polling remains in game pages
grep -r "setInterval" /home/perico/work/last-island/client/src/app/game/

# 4. Confirm SSE hook exists and exports correctly
grep -r "useGameEvents" /home/perico/work/last-island/client/src/lib/game/

# 5. Confirm event types are defined
grep -r "GameEventType\|GameEventHandlers" /home/perico/work/last-island/client/src/types/

# 6. Confirm EventSource URL uses NEXT_PUBLIC_API_URL (absolute, not proxied)
grep -r "NEXT_PUBLIC_API_URL\|EventSource" /home/perico/work/last-island/client/src/lib/game/use-game-events.ts

# 7. Confirm hook is integrated in game page
grep -r "useGameEvents" /home/perico/work/last-island/client/src/app/game/
```

## Rollback

```bash
cd /home/perico/work/last-island/client
git checkout HEAD -- src/app/game/\[token\]/page.tsx src/app/game/\[token\]/battle-screen.tsx src/lib/game/index.ts src/types/
rm -f src/types/game-events.ts src/lib/game/use-game-events.ts
```
