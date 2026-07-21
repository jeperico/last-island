# Fix USSOP → USOPP Spelling Across Codebase

## Objective

Correct the misspelling of One Piece character "Usopp" (one 's', two 'p's) in the backend enum, database, frontend components, steering docs, and asset filenames.

## Files to touch

- modify: `service/src/main/java/com/last_island/api/domain/user/enums/Avatar.java`
- create: `service/src/main/resources/db/migration/V16__fix_usopp_spelling.sql`
- modify: `client/src/components/character-select.tsx`
- modify: `client/src/app/settings/page.tsx`
- modify: `.kiro/steering/server/domain.md`
- rename: `client/public/avatars/ussop/` → `client/public/avatars/usopp/`
- rename: `client/public/avatars/usopp/ussop-bg-01.jpg` → `usopp-bg-01.jpg`
- rename: `client/public/avatars/usopp/ussop-bg-02.jpg` → `usopp-bg-02.jpg`
- rename: `client/public/avatars/usopp/ussop-bg-03.jpg` → `usopp-bg-03.jpg`
- rename: `client/public/avatars/usopp/ussop-bg-04.jpg` → `usopp-bg-04.jpg`

## Steps

1. Rename asset directory `client/public/avatars/ussop/` → `client/public/avatars/usopp/` (mv the whole directory)
2. Rename background files inside the new directory:
   - `ussop-bg-01.jpg` → `usopp-bg-01.jpg`
   - `ussop-bg-02.jpg` → `usopp-bg-02.jpg`
   - `ussop-bg-03.jpg` → `usopp-bg-03.jpg`
   - `ussop-bg-04.jpg` → `usopp-bg-04.jpg`
3. Modify `Avatar.java`: change `USSOP` → `USOPP` in the enum constant list
4. Create `V16__fix_usopp_spelling.sql` with content:
   ```sql
   UPDATE users SET avatar = 'USOPP' WHERE avatar = 'USSOP';
   ```
5. Modify `client/src/components/character-select.tsx`:
   - key: `"USSOP"` → `"USOPP"`
   - name: `"Ussop"` → `"Usopp"`
   - image: `"/avatars/ussop/full-body.jpg"` → `"/avatars/usopp/full-body.jpg"`
6. Modify `client/src/app/settings/page.tsx`:
   - key: `"USSOP"` → `"USOPP"`
   - name: `"Ussop"` → `"Usopp"`
   - image: `"/avatars/ussop/profile.jpg"` → `"/avatars/usopp/profile.jpg"`
7. Modify `.kiro/steering/server/domain.md` line 53: `USSOP` → `USOPP`

## Verification

```bash
# 1. Backend build + tests pass
cd service && mvn compile -q && mvn test -q; cd ..

# 2. Frontend build passes
cd client && npx next build; cd ..

# 3. No remaining USSOP/Ussop/ussop references in code (excluding V15 migration, .gsd/SUMMARY.md, .git/)
grep -ri "ussop" --include="*.java" --include="*.tsx" --include="*.ts" --include="*.md" --include="*.sql" \
  --exclude-dir=.git --exclude-dir=node_modules . \
  | grep -v "V15__rename_doflamingo_to_ussop" \
  | grep -v ".gsd/SUMMARY.md" \
  | grep -v ".gsd/PLAN.md"
# Expected: empty (no matches)

# 4. New migration file exists
test -f service/src/main/resources/db/migration/V16__fix_usopp_spelling.sql && echo "OK"

# 5. Avatar enum has USOPP
grep "USOPP" service/src/main/java/com/last_island/api/domain/user/enums/Avatar.java

# 6. Asset directory renamed correctly
test -d client/public/avatars/usopp && echo "OK"
test ! -d client/public/avatars/ussop && echo "OK"
ls client/public/avatars/usopp/usopp-bg-*.jpg | wc -l
# Expected: 4
```

## Rollback

```bash
# Undo asset renames
mv client/public/avatars/usopp client/public/avatars/ussop
cd client/public/avatars/ussop
mv usopp-bg-01.jpg ussop-bg-01.jpg
mv usopp-bg-02.jpg ussop-bg-02.jpg
mv usopp-bg-03.jpg ussop-bg-03.jpg
mv usopp-bg-04.jpg ussop-bg-04.jpg
cd -

# Revert code changes
git checkout -- service/src/main/java/com/last_island/api/domain/user/enums/Avatar.java
git checkout -- client/src/components/character-select.tsx
git checkout -- client/src/app/settings/page.tsx
git checkout -- .kiro/steering/server/domain.md

# Remove new migration
rm -f service/src/main/resources/db/migration/V16__fix_usopp_spelling.sql
```
