# Fix Armament Haki Notification — Clarity & Duration

## Objective

Fix two UX issues with the Armament Haki notification shown to the attacker:
1. **Message is misleading**: "Turn lost!" implies the current turn ends immediately, but the skip is deferred (consumed on a future miss). Change the copy to convey "you will lose a future turn."
2. **Duration too short**: 3 seconds is not enough time to read. Increase to 5 seconds.

Also fix the counter-fire notification duration to 5s for consistency.

## Files to touch

- **modify** `client/src/app/game/[token]/battle-screen.tsx` — update message text + setTimeout durations

## Steps

1. In `handleFire`, change the armament triggered message from:
   ```
   "⚡ Armament Haki deflects your momentum! Turn lost!"
   ```
   to:
   ```
   "⚡ Armament Haki hardens the hull! You'll lose a future turn."
   ```

2. Change the `setTimeout` for the armament message from `3000` to `5000`.

3. Change the `setTimeout` for the counter-fire message from `3000` to `5000`.

## Verification

```bash
# 1. Build check
cd client && npm run build

# 2. Message text updated
grep "future turn" client/src/app/game/[token]/battle-screen.tsx
# Expected: 1 match

# 3. No remaining "Turn lost" text
grep -c "Turn lost" client/src/app/game/[token]/battle-screen.tsx
# Expected: 0

# 4. Armament setTimeout is 5000
grep -A1 "armamentTriggered" client/src/app/game/[token]/battle-screen.tsx | grep -c "5000"
# Expected: 1

# 5. Counter-fire setTimeout is 5000
grep -A1 "counterFire" client/src/app/game/[token]/battle-screen.tsx | grep -c "5000"
# Expected: 1
```

## Rollback

```bash
git checkout -- client/src/app/game/[token]/battle-screen.tsx
```
