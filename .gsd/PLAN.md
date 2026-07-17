# Plan: 3x bounty gain multiplier for wins

## Objective

Multiply the bounty gain for wins by 3 while keeping loss amounts exactly unchanged.

## Files to touch

- modify `service/src/main/java/com/last_island/api/domain/user/service/BountyService.java` — add `gain *= 3;` after the ratio branching block, update Javadoc progression comments
- modify `service/src/test/java/com/last_island/api/domain/user/service/BountyServiceTest.java` — update winner bounty assertions to reflect 3x gains; loser assertions stay the same

## Steps

1. In `BountyService.java`, add `gain *= 3;` on a new line after the final `else` block (after the closing brace at line ~48) and before `long newWinnerBounty = winner.getBounty() + gain;`. Add a comment: `// 3x win multiplier — aggressive progression`.

2. Update the Javadoc comment on `updateBounties` to reflect new progression expectations:
   - Equal match: gain = 150M (was 50M)
   - Big underdog: gain = 300M (was 100M)
   - Slight underdog: gain = 225M (was 75M)
   - Slight favorite: gain = 112.5M (was 37.5M) → `baseGain * 3 / 4 * 3 = 112_500_000L`
   - Big favorite: gain = 75M (was 25M)

3. Update `BountyServiceTest.java` assertions — only winner bounty values change:
   - `updateBounties_equalMatch_winnerGains50M`: rename to `updateBounties_equalMatch_winnerGains150M`, assert winner = 250_000_000L (was 150M), loser stays 50_000_000L
   - `updateBounties_underdogWins_gainsDouble`: assert underdog = 350_000_000L (50M + 300M), favorite stays 175_000_000L
   - `updateBounties_favoriteWins_gainsLess`: assert favorite = 275_000_000L (200M + 75M), underdog stays 0L (50M - 100M = floor)
   - `updateBounties_bountyFloor_cannotGoBelowZero`: loser assertion unchanged (still ≥ 0)
   - `updateBounties_rankPromotion_crossesSupernova`: winner at 160M gains 150M → 310_000_000L, rank = "SUPERNOVA" (still correct since 200M–399M = SUPERNOVA)
   - `updateBounties_rankDemotion_dropsBelowSuperRookie`: loser assertion unchanged (50M → ROOKIE); winner goes from 100M + 150M = 250_000_000L, rank = "SUPERNOVA"
   - `computeRank_pirateThresholds`: no changes (rank thresholds unchanged)

4. Verify the `ratio` calculation still works for the `updateBounties_rankPromotion` test: 160/160 = 1.0, which is in [0.9, 1.1) → gain = baseGain * 3 = 150M. Winner: 160M + 150M = 310M = SUPERNOVA ✓

## Verification

```bash
cd service && mvn test -Dtest=BountyServiceTest -pl .
```
Expected: 7 tests pass.

```bash
cd service && mvn test -pl .
```
Expected: all tests pass (73+). No callers need changes since they only consume the returned `gain` value.

```bash
cd client && npm run build
```
Expected: clean build (no frontend changes needed).

Manual checks:
- Grep for hardcoded `50_000_000` in test files outside BountyServiceTest — ensure no other tests assert winner bounties from this service
- Confirm `gain *= 3` is placed AFTER the if/else block and BEFORE `newWinnerBounty` assignment
- Confirm loss values in all test assertions are unchanged from current values

## Rollback

```bash
git checkout -- service/src/main/java/com/last_island/api/domain/user/service/BountyService.java service/src/test/java/com/last_island/api/domain/user/service/BountyServiceTest.java
```
