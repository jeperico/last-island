# Refactor `<img>` Tags to Next.js `<Image>` Component

## Objective

Replace all 5 `<img>` tags across the client with Next.js `<Image>` (from `next/image`) to enable automatic image optimization, responsive sizing, and lazy loading, while preserving the AvatarIcon data-URI fallback behavior.

## Files to touch

- **modify** `client/src/components/ui/avatar-icon.tsx` — split rendering: `<Image>` for real avatar, plain `<img>` for data-URI fallback; add `priority` and auto-derived `sizes` props
- **modify** `client/src/app/(auth)/login/page.tsx` — skull icon `<img>` → `<Image>` with `priority`
- **modify** `client/src/app/(auth)/register/page.tsx` — skull icon `<img>` → `<Image>` with `priority`
- **modify** `client/src/app/haki/page.tsx` — banner bg `<img>` → `<Image fill>` with sizes
- **modify** `client/src/app/settings/page.tsx` — banner bg `<img>` → `<Image fill>` with sizes
- **modify** `client/src/app/page.tsx` — pass `priority` prop to AvatarIcon for top-3 podium avatars and user's own header avatar
- **modify** `client/next.config.ts` — add `images: { formats: ['image/avif', 'image/webp'] }` config

## Steps

1. **Modify `client/next.config.ts`** — Add `images: { formats: ['image/avif', 'image/webp'] }` to the NextConfig object.

2. **Modify `client/src/components/ui/avatar-icon.tsx`**:
   - Add `import Image from "next/image"`.
   - Add `priority?: boolean` to `AvatarIconProps`.
   - Add a `sizesMap` constant: `{ sm: "32px", md: "48px", lg: "64px" }`.
   - Add a `pixelSizeMap` constant: `{ sm: 32, md: 48, lg: 64 }` (for width/height numeric props).
   - Replace the single `<img>` with conditional rendering:
     - When `hasError` is `true`: render `<img src={FALLBACK} ...>` (data URIs cannot be optimized by next/image). No eslint-disable needed since this is intentional for data-URI only.
     - When `hasError` is `false`: render `<Image src={src} width={pixelSizeMap[size]} height={pixelSizeMap[size]} sizes={sizesMap[size]} priority={priority} onError={() => setHasError(true)} ...>`.
   - Remove the `eslint-disable-next-line @next/next/no-img-element` comment (the fallback `<img>` for data-URI is acceptable; add a brief comment explaining why plain img is used there).

3. **Modify `client/src/app/(auth)/login/page.tsx`**:
   - Add `import Image from "next/image"`.
   - Replace `<img src="/skull-icon.png" ... width={64} height={64}>` with `<Image src="/skull-icon.png" alt="Jolly Roger" width={64} height={64} priority className="drop-shadow-[0_0_8px_rgba(37,99,235,0.4)]" />`.
   - Remove the `eslint-disable-next-line` comment.

4. **Modify `client/src/app/(auth)/register/page.tsx`**:
   - Same changes as login page (step 3).

5. **Modify `client/src/app/haki/page.tsx`**:
   - Add `import Image from "next/image"`.
   - Replace the banner `<img src={...} className="absolute inset-0 w-full h-full object-cover">` with `<Image src={...} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />`.
   - Remove eslint-disable comment if present.

6. **Modify `client/src/app/settings/page.tsx`**:
   - Same pattern as haki page (step 5).

7. **Modify `client/src/app/page.tsx`**:
   - Pass `priority` prop to the header AvatarIcon (line ~262, the user's own avatar).
   - Pass `priority` prop to the top-3 podium AvatarIcons (line ~366, the `size="lg"` ones inside the podium cards).
   - Do NOT add priority to the scrollable list items (those should lazy-load).

## Verification

```bash
# 1. Build must pass (confirms no type errors, no broken imports)
make client-build

# 2. Lint must pass (confirms no-img-element rule satisfied)
make client-lint

# 3. Confirm no eslint-disable for no-img-element remains
grep -r "no-img-element" client/src/ && echo "FAIL: stale eslint-disable" || echo "PASS"

# 4. Confirm no <img> tags remain in the 5 target files (except AvatarIcon fallback)
grep -n "<img" client/src/app/\(auth\)/login/page.tsx client/src/app/\(auth\)/register/page.tsx client/src/app/haki/page.tsx client/src/app/settings/page.tsx && echo "FAIL: stale img tags" || echo "PASS"

# 5. Confirm AvatarIcon has conditional rendering (Image for normal, img for fallback)
grep -c "from \"next/image\"" client/src/components/ui/avatar-icon.tsx | grep -q "1" && echo "PASS: Image import" || echo "FAIL"
grep -c "<Image" client/src/components/ui/avatar-icon.tsx | grep -q "1" && echo "PASS: Image usage" || echo "FAIL"
grep -c "<img" client/src/components/ui/avatar-icon.tsx | grep -q "1" && echo "PASS: fallback img" || echo "FAIL"

# 6. Confirm priority prop exists on AvatarIcon interface
grep "priority" client/src/components/ui/avatar-icon.tsx | grep -q "boolean" && echo "PASS" || echo "FAIL"

# 7. Confirm priority passed in page.tsx for podium + header
grep -c "priority" client/src/app/page.tsx | xargs test 3 -le && echo "PASS: >=3 priority usages" || echo "FAIL"

# 8. Confirm next.config.ts has image formats
grep "avif" client/next.config.ts && echo "PASS" || echo "FAIL"

# 9. Confirm sizes prop on AvatarIcon Image
grep "sizes=" client/src/components/ui/avatar-icon.tsx | grep -q "sizesMap" && echo "PASS" || echo "FAIL"
```

## Rollback

```bash
git checkout -- client/src/components/ui/avatar-icon.tsx \
  client/src/app/\(auth\)/login/page.tsx \
  client/src/app/\(auth\)/register/page.tsx \
  client/src/app/haki/page.tsx \
  client/src/app/settings/page.tsx \
  client/src/app/page.tsx \
  client/next.config.ts
```
