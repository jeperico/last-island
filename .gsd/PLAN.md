# Refactor Armament Haki Absorption Limits

## Objective

Change Armament Haki absorption caps so ship1 absorbs up to 3 hits (was 1) and ship2 absorbs unlimited hits (was capped at 3), while preserving Level 3 counter-fire behavior and immediate turn-switch on each absorbed hit.

## Files to touch

- **modify** `service/src/main/java/com/last_island/api/domain/haki/service/HakiBattleService.java` — update absorption cap logic in `checkArmamentTrigger()`
- **modify** `service/src/test/java/com/last_island/api/domain/haki/service/HakiArmamentServiceTest.java` — fix existing tests and add new ones for the new limits

## Steps

1. **Modify `HakiBattleService.java` line 197** — change ship1 cap from `< 1` to `< 3`:
   ```java
   // Before
   if (state.getArmamentShip1HitsAbsorbed() < 1) {
   // After
   if (state.getArmamentShip1HitsAbsorbed() < 3) {
   ```

2. **Modify `HakiBattleService.java` line 207** — remove the cap check for ship2 entirely. The absorption block and counter-fire logic (Level 3 check at ~line 211-213) must remain, only the `if (state.getArmamentShip2HitsAbsorbed() < 3)` guard is removed:
   ```java
   // Before
   if (state.getArmamentShip2HitsAbsorbed() < 3) {
       state.setArmamentShip2HitsAbsorbed(state.getArmamentShip2HitsAbsorbed() + 1);
       // ... absorption + counter-fire logic ...
   }
   // After (remove the if wrapper, keep the body at the same indent level)
   state.setArmamentShip2HitsAbsorbed(state.getArmamentShip2HitsAbsorbed() + 1);
   // ... absorption + counter-fire logic ...
   ```
   Ensure the closing `}` of the removed `if` is also removed. The `if (state.getArmamentLevel() == 3)` counter-fire block inside must be preserved unchanged.

3. **Modify test `checkArmament_lv1_secondHitOnShip1_noTrigger` (~line 297)**:
   - Rename to `checkArmament_lv1_fourthHitOnShip1_noTrigger`
   - Change `state.setArmamentShip1HitsAbsorbed(1)` → `state.setArmamentShip1HitsAbsorbed(3)`
   - Assertions remain the same (hit is NOT absorbed because cap reached)

4. **Rename test `checkArmament_lv2_ship2_first3Hits_eachTriggers` (~line 317)**:
   - Rename to `checkArmament_lv2_ship2_multipleHits_eachTriggers`
   - Body unchanged (3 sequential hits all trigger — still valid for unlimited)

5. **Rewrite test `checkArmament_lv2_ship2_fourthHit_noTrigger` (~line 351)**:
   - Rename to `checkArmament_lv2_ship2_manyHits_allTrigger`
   - Set `state.setArmamentShip2HitsAbsorbed(50)` (simulating 50 prior absorptions)
   - Assert that the next hit IS absorbed (trigger returned, counter incremented to 51)
   - Assert turn switch is triggered (same pattern as existing absorption tests)

6. **Add new test `checkArmament_lv1_thirdHitOnShip1_triggerReturned`** (after existing lv1 tests):
   - Set `state.setArmamentShip1HitsAbsorbed(2)` (already absorbed 2)
   - Fire at ship1
   - Assert trigger IS returned (3rd hit absorbed, counter goes to 3)
   - Assert turn switch triggered

7. **Add new test `checkArmament_lv2_ship2_unlimitedAbsorption_stillTriggers`** (after existing lv2 tests):
   - Set `state.setArmamentShip2HitsAbsorbed(99)`
   - Fire at ship2
   - Assert trigger IS returned (100th hit absorbed, counter goes to 100)
   - Confirms no upper bound exists

## Verification

```bash
# 1. Run the specific Armament test class
cd /home/perico/work/last-island/service && ./mvnw test -pl . -Dtest=HakiArmamentServiceTest

# 2. Run full service test suite to catch regressions
cd /home/perico/work/last-island/service && ./mvnw test -pl .

# 3. Verify ship1 cap changed to 3
grep -n "getArmamentShip1HitsAbsorbed() < 3" service/src/main/java/com/last_island/api/domain/haki/service/HakiBattleService.java

# 4. Verify ship2 cap removed (no cap check should remain)
grep -n "getArmamentShip2HitsAbsorbed() <" service/src/main/java/com/last_island/api/domain/haki/service/HakiBattleService.java | grep -v "test"

# 5. Verify counter-fire logic preserved
grep -n "getArmamentLevel() == 3" service/src/main/java/com/last_island/api/domain/haki/service/HakiBattleService.java

# 6. Verify new tests exist
grep -n "fourthHitOnShip1_noTrigger\|thirdHitOnShip1_triggerReturned\|manyHits_allTrigger\|unlimitedAbsorption_stillTriggers\|multipleHits_eachTriggers" service/src/test/java/com/last_island/api/domain/haki/service/HakiArmamentServiceTest.java
```

## Rollback

```bash
cd /home/perico/work/last-island
git checkout -- service/src/main/java/com/last_island/api/domain/haki/service/HakiBattleService.java
git checkout -- service/src/test/java/com/last_island/api/domain/haki/service/HakiArmamentServiceTest.java
```
