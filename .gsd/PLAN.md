# Fix SSE Connection Leak and Add Heartbeat Keepalive

## Objective

Fix the SSE gauge counter leak caused by silent emitter replacement on reconnect, fix the `removeGame()` decrement omission, and add a 15-second heartbeat scheduler to prevent proxy/browser idle disconnects.

## Files to touch

- modify: `service/src/main/java/com/last_island/api/infrastructure/sse/SseConnectionRegistry.java` — fix register() to complete old emitter before replacing, fix remove() to use reference equality, fix removeGame() to decrement counter, add `sendHeartbeatToAll()` method
- modify: `service/src/main/java/com/last_island/api/infrastructure/sse/LobbySseRegistry.java` — fix register() to complete old emitter before replacing, fix remove() to use reference equality, add `sendHeartbeatToAll()` method
- create: `service/src/main/java/com/last_island/api/infrastructure/sse/SseHeartbeatScheduler.java` — @Component with @Scheduled(fixedRate=15000) calling heartbeat on both registries
- modify: `service/src/test/java/com/last_island/api/infrastructure/sse/SseConnectionRegistryTest.java` — add tests for reconnect counter stability and removeGame decrement
- create: `service/src/test/java/com/last_island/api/infrastructure/sse/LobbySseRegistryTest.java` — test reconnect counter stability
- create: `service/src/test/java/com/last_island/api/infrastructure/sse/SseHeartbeatSchedulerTest.java` — test that scheduler calls heartbeat on both registries

## Steps

1. **Fix `SseConnectionRegistry.register()` — close old emitter before replacing:**
   - Before `emitters.computeIfAbsent(...).put(userId, emitter)`, retrieve the existing emitter for that userId via `gameEmitters.get(userId)`.
   - If an old emitter exists, call `oldEmitter.complete()` on it. This will trigger its `onCompletion` callback → `remove()`. However, since we haven't put the new one yet, `remove()` will remove the old one and decrement — correct behavior.
   - Then proceed with `put(userId, emitter)` and `incrementSseConnections()` as before.
   - Wrap `oldEmitter.complete()` in try-catch (IllegalStateException) since it may already be completed.

2. **Fix `SseConnectionRegistry.remove()` — reference equality guard:**
   - Change `gameEmitters.remove(userId)` to `gameEmitters.remove(userId, emitter)` using a 2-arg overload. Problem: `remove()` doesn't receive the emitter reference.
   - Better approach: use `ConcurrentHashMap.remove(key, value)` — but the callback doesn't know the emitter reference.
   - Simplest safe fix: Since step 1 ensures old emitter is completed BEFORE new one is inserted, the race is eliminated. The `onCompletion` callback for the old emitter fires synchronously during `complete()` (or asynchronously in Spring). If asynchronous, it could fire after the new emitter is put.
   - To be safe against the async case: store the emitter reference in the callback closure and compare it with the current map value before removing. Change the callbacks to capture `final SseEmitter thisEmitter = emitter` and in the callback body: `if (gameEmitters.get(userId) == thisEmitter) { remove(gameToken, userId); }`. This ensures late-firing callbacks for old emitters don't evict the new one.

3. **Fix `SseConnectionRegistry.removeGame()` — decrement counter:**
   - After `emitters.remove(gameToken)`, for each emitter in the removed map, call `gameMetrics.decrementSseConnections()` before `emitter.complete()`.
   - Also disable the `onCompletion` callback from double-decrementing: since the emitter is already removed from the map, the callback's `remove()` call will find nothing and not decrement (the null check protects it). Safe.

4. **Fix `LobbySseRegistry.register()` — close old emitter before replacing:**
   - Before `emitters.put(userId, emitter)`, get old emitter via `emitters.get(userId)`.
   - If old exists, call `oldEmitter.complete()` in try-catch. This triggers `onCompletion` → `remove(userId)` → decrement. Then `put(userId, emitter)` + `increment`.
   - Same reference equality guard: capture `final SseEmitter thisEmitter = emitter` in callbacks, check `emitters.get(userId) == thisEmitter` before calling `remove(userId)`.

5. **Add `sendHeartbeatToAll()` to `SseConnectionRegistry`:**
   - New public method that iterates all game emitters and sends an SSE comment via `emitter.send(SseEmitter.event().comment("heartbeat"))`.
   - Use `synchronized(emitter)` (matching existing `doSend` pattern).
   - Catch IOException/IllegalStateException per emitter (don't let one broken emitter stop others).

6. **Add `sendHeartbeatToAll()` to `LobbySseRegistry`:**
   - Same pattern: iterate `emitters.values()`, send SSE comment, synchronized, catch per-emitter.

7. **Create `SseHeartbeatScheduler.java`:**
   - Package: `com.last_island.api.infrastructure.sse`
   - `@Component` class, constructor-injected with `SseConnectionRegistry` + `LobbySseRegistry`.
   - Single method annotated `@Scheduled(fixedRate = 15000)` that calls `sseConnectionRegistry.sendHeartbeatToAll()` and `lobbySseRegistry.sendHeartbeatToAll()`.
   - `@EnableScheduling` already exists on `CoreApiApplication.java` — no change needed.

8. **Update `SseConnectionRegistryTest.java`:**
   - Add test: `register_sameUserTwice_completesOldEmitter` — register userId, then register same userId again for same game. Verify `gameMetrics.incrementSseConnections()` called twice but counter is effectively +1 net (verify `decrementSseConnections()` called once for old emitter completion). Use `verify(gameMetrics, times(2)).incrementSseConnections()` and `verify(gameMetrics, times(1)).decrementSseConnections()`.
   - Add test: `removeGame_decrementsCounterPerPlayer` — register 2 players, call removeGame, verify `decrementSseConnections()` called twice.

9. **Create `LobbySseRegistryTest.java`:**
   - Same test pattern: `register_sameUserTwice_completesOldEmitter`.
   - Verify increment called twice, decrement called once.

10. **Create `SseHeartbeatSchedulerTest.java`:**
    - Unit test: mock both registries, call the scheduled method, verify `sendHeartbeatToAll()` called on both.

## Verification

```bash
# 1. Build + test backend
cd service && ./mvnw test -q

# 2. Verify old emitter cleanup exists in register methods
grep -n "complete" service/src/main/java/com/last_island/api/infrastructure/sse/SseConnectionRegistry.java
grep -n "complete" service/src/main/java/com/last_island/api/infrastructure/sse/LobbySseRegistry.java

# 3. Verify removeGame decrements
grep -n "decrementSseConnections" service/src/main/java/com/last_island/api/infrastructure/sse/SseConnectionRegistry.java

# 4. Verify heartbeat scheduler exists
grep -rn "@Scheduled" service/src/main/java/com/last_island/api/infrastructure/sse/

# 5. Verify heartbeat send mechanism
grep -n "heartbeat\|comment" service/src/main/java/com/last_island/api/infrastructure/sse/SseConnectionRegistry.java
grep -n "heartbeat\|comment" service/src/main/java/com/last_island/api/infrastructure/sse/LobbySseRegistry.java

# 6. Verify reference equality guard in callbacks
grep -n "thisEmitter\|== emitter" service/src/main/java/com/last_island/api/infrastructure/sse/SseConnectionRegistry.java
grep -n "thisEmitter\|== emitter" service/src/main/java/com/last_island/api/infrastructure/sse/LobbySseRegistry.java

# 7. Verify new tests exist
grep -l "sameUserTwice\|completesOldEmitter\|removeGame_decrementsCounter\|HeartbeatSchedulerTest" service/src/test/java/com/last_island/api/infrastructure/sse/*.java

# 8. Frontend build still passes (server-side only change)
cd client && npm run build
```

## Rollback

```bash
git checkout -- service/src/main/java/com/last_island/api/infrastructure/sse/SseConnectionRegistry.java
git checkout -- service/src/main/java/com/last_island/api/infrastructure/sse/LobbySseRegistry.java
git checkout -- service/src/test/java/com/last_island/api/infrastructure/sse/SseConnectionRegistryTest.java
rm -f service/src/main/java/com/last_island/api/infrastructure/sse/SseHeartbeatScheduler.java
rm -f service/src/test/java/com/last_island/api/infrastructure/sse/LobbySseRegistryTest.java
rm -f service/src/test/java/com/last_island/api/infrastructure/sse/SseHeartbeatSchedulerTest.java
```
