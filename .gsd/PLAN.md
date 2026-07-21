# Rename DOFLAMINGO Avatar to USSOP

## Objective

Replace the DOFLAMINGO avatar with USSOP across backend enum, database, frontend components, and steering docs.

## Files to touch

- modify: `service/src/main/java/com/last_island/api/domain/user/enums/Avatar.java`
- create: `service/src/main/resources/db/migration/V15__rename_doflamingo_to_ussop.sql`
- modify: `client/src/components/character-select.tsx`
- modify: `client/src/app/settings/page.tsx`
- modify: `.kiro/steering/server/domain.md`

## Steps

1. In `service/src/main/java/com/last_island/api/domain/user/enums/Avatar.java`, change `DOFLAMINGO` to `USSOP` in the enum values list.

2. Create `service/src/main/resources/db/migration/V15__rename_doflamingo_to_ussop.sql` with contents:
   ```sql
   UPDATE users SET avatar = 'USSOP' WHERE avatar = 'DOFLAMINGO';
   ```

3. In `client/src/components/character-select.tsx` (lines ~57-61), update the Doflamingo entry:
   - `key`: `"USSOP"`
   - `name`: `"Ussop"`
   - `quote`: `"I'll become a brave warrior of the sea!"`
   - `image`: `"/avatars/ussop/full-body.jpg"`

4. In `client/src/app/settings/page.tsx` (lines ~28-31), update the Doflamingo entry:
   - `key`: `"USSOP"`
   - `name`: `"Ussop"`
   - `image`: `"/avatars/ussop/profile.jpg"`

5. In `.kiro/steering/server/domain.md` (line ~53), replace `DOFLAMINGO` with `USSOP` in the Avatar enum list.

## Verification

```bash
# Backend build + tests pass
cd service && mvn clean test -q

# Frontend build passes
cd client && npm run build

# No remaining references to DOFLAMINGO or doflamingo in code
grep -ri "doflamingo" service/src/ client/src/ .kiro/

# USSOP present in all expected locations
grep -n "USSOP" service/src/main/java/com/last_island/api/domain/user/enums/Avatar.java
grep -n "USSOP" client/src/components/character-select.tsx
grep -n "USSOP" client/src/app/settings/page.tsx
grep -n "USSOP" .kiro/steering/server/domain.md
cat service/src/main/resources/db/migration/V15__rename_doflamingo_to_ussop.sql
```

## Rollback

```bash
git checkout -- service/src/main/java/com/last_island/api/domain/user/enums/Avatar.java
git checkout -- client/src/components/character-select.tsx
git checkout -- client/src/app/settings/page.tsx
git checkout -- .kiro/steering/server/domain.md
rm -f service/src/main/resources/db/migration/V15__rename_doflamingo_to_ussop.sql
```
