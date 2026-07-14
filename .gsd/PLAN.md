# Add Lobby SSE — Auto-update Available Battles

## Objective

Add a global lobby SSE channel so the dashboard auto-updates the "available battles" list when a new game is created or a game becomes unavailable (joined/cancelled). Users on the dashboard subscribe to a `/lobby/events` stream and receive GAME_CREATED/GAME_REMOVED events.

## Files to touch

### Backend
- **create** `service/src/main/java/com/last_island/api/infrastructure/sse/LobbySseRegistry.java` — global SSE registry for lobby connections (userId → SseEmitter), no buffering needed
- **create** `service/src/main/java/com/last_island/api/infrastructure/sse/LobbyEvent.java` — record for lobby events (GAME_CREATED, GAME_REMOVED)
- **create** `service/src/main/java/com/last_island/api/infrastructure/sse/LobbyEventEmitter.java` — service that broadcasts lobby events to all connected users
- **create** `service/src/main/java/com/last_island/api/domain/lobby/controller/LobbyController.java` — GET `/lobby/events` SSE endpoint
- **modify** `service/src/main/java/com/last_island/api/domain/game/service/GameService.java` — emit GAME_CREATED after createGame, emit GAME_REMOVED after joinGame

### Frontend
- **modify** `client/src/types/game-events.ts` — add lobby event types
- **create** `client/src/lib/game/use-lobby-events.ts` — hook to subscribe to lobby SSE
- **modify** `client/src/lib/game/index.ts` — export useLobbyEvents
- **modify** `client/src/app/page.tsx` — use lobby SSE to prepend/remove games from the list

## Steps

1. **LobbySseRegistry**: Manages userId→SseEmitter map. `register(userId)` creates emitter, `remove(userId)` cleans up, `broadcast(LobbyEvent)` sends to all. Simple — no event buffering (lobby is ephemeral).

2. **LobbyEvent**: Record with `type` and `data` (Map). Types: `LOBBY_CONNECTED`, `GAME_CREATED`, `GAME_REMOVED`.

3. **LobbyEventEmitter**: Service with `emitGameCreated(token, bluePlayerName, createdAt)` and `emitGameRemoved(token)`.

4. **LobbyController**: `GET /lobby/events` — authenticates user, registers in LobbySseRegistry, returns SseEmitter.

5. **GameService changes**: After `createGame` commit → emit GAME_CREATED. After `joinGame` commit → emit GAME_REMOVED.

6. **Frontend hook**: `useLobbyEvents({ onGameCreated, onGameRemoved }, enabled)` — similar pattern to `useGameEvents` but connects to `/api/lobby/events`.

7. **Dashboard integration**: On GAME_CREATED → prepend to game list (if under limit). On GAME_REMOVED → filter out by token.

## Verification

```bash
cd service && ./mvnw clean verify -q
cd client && npm run build
cd client && npm run lint
```

## Rollback

```bash
git checkout -- service/src/main/java/com/last_island/api/infrastructure/sse/LobbySseRegistry.java service/src/main/java/com/last_island/api/infrastructure/sse/LobbyEvent.java service/src/main/java/com/last_island/api/infrastructure/sse/LobbyEventEmitter.java service/src/main/java/com/last_island/api/domain/lobby/controller/LobbyController.java service/src/main/java/com/last_island/api/domain/game/service/GameService.java client/src/types/game-events.ts client/src/lib/game/use-lobby-events.ts client/src/lib/game/index.ts client/src/app/page.tsx
```
