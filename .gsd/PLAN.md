# Full-screen Character Select Screen for Registration

## Objective

Replace the inline avatar grid on the registration page with a full-screen fighting-game-style character select overlay that displays 6 One Piece characters as diagonal parallelogram panels with selection glow, laugh audio, and a confirm button.

## Files to touch

- **create** `client/src/components/character-select.tsx` — Full-screen character select overlay component
- **modify** `client/src/app/(auth)/register/page.tsx` — Remove inline avatar grid, change form submission flow to open overlay for pirates, pass registration callback to overlay
- **modify** `client/src/styles/globals.css` — Add `@keyframes character-select-in` entry animation

## Steps

1. **Add entry animation keyframes to globals.css**
   - Add `@keyframes character-select-in` with `from { opacity: 0; transform: scale(0.9); }` `to { opacity: 1; transform: scale(1); }` (300ms ease-out)
   - Register in `@theme inline` if needed, or use via `animate-[character-select-in_300ms_ease-out_forwards]`

2. **Create `client/src/components/character-select.tsx`**
   - `"use client"` directive
   - Props interface: `{ onConfirm: (avatar: string) => void; onClose: () => void; isLoading?: boolean }`
   - Define `CHARACTER_OPTIONS` array with 6 entries: `{ key: string; name: string; quote: string; image: string }` using `/avatars/{key}/full-body.jpg` paths and the flavor text from the spec
   - Component state: `selected: string | null`
   - Import `useSound` from `@/lib/sound`, call `playLaugh(key)` on character click
   - Import `Button` from `@/components/ui`
   - Render structure:
     - Outer: `fixed inset-0 z-50 bg-navy/95 flex flex-col items-center justify-center` with entry animation class
     - Title: "Choose Your Captain" at top center, styled with `text-text-primary text-2xl font-bold`
     - Panels container: `flex w-full h-[70vh] gap-1 px-4` (6 panels side by side)
     - Each panel: `<button>` with `flex-1 relative overflow-hidden transition-all duration-300 cursor-pointer` 
       - CSS clip-path: `polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)` for parallelogram shape (first panel: `polygon(0% 0%, 100% 0%, 90% 100%, 0% 100%)`, last panel: `polygon(10% 0%, 100% 0%, 100% 100%, 0% 100%)`)
       - Background: `div` with `absolute inset-0 bg-cover bg-top` using inline `backgroundImage: url(image)`
       - Idle state: apply `brightness-50 grayscale-[30%]` filter to background
       - Selected state: `brightness-100 grayscale-0` + gold glow via `shadow-[0_0_30px_rgba(245,158,11,0.6)]` or outline
       - Unselected-when-one-is-selected state: `brightness-30 grayscale-[50%]`
       - Bottom overlay: gradient from transparent to black, containing character name (bold, uppercase) and flavor text (italic, smaller, text-secondary)
     - Escape key handler: `useEffect` with `keydown` listener calling `onClose()`
     - Body scroll lock: `useEffect` setting `document.body.style.overflow = 'hidden'` on mount, restoring on unmount
   - Confirm area at bottom: render `Button` variant="primary" size="lg" with text "⚓ Set Sail!" only when `selected !== null`, onClick calls `onConfirm(selected)`, pass `isLoading` prop
   - Back button: small ghost/text button "← Back" at top-left corner calling `onClose()`

3. **Modify `client/src/app/(auth)/register/page.tsx`**
   - Remove the `AVATAR_OPTIONS` constant (lines 22-29)
   - Remove the inline avatar grid JSX block (lines ~226-260) — the entire conditional `{filiation === "PIRATE" && (...)}` avatar section
   - Remove the `avatar` field watch if no longer needed inline (keep if used for other logic)
   - Add state: `const [showCharacterSelect, setShowCharacterSelect] = useState(false)`
   - Add state: `const [isRegistering, setIsRegistering] = useState(false)`
   - Change `onValid(data)` logic:
     - If `data.filiation === "MARINE"`: call `auth.register(name, email, password, filiation, null)` directly (existing behavior)
     - If `data.filiation === "PIRATE"`: call `setShowCharacterSelect(true)` (do NOT register yet)
   - Add handler: `handleCharacterConfirm = async (avatar: string) => { setIsRegistering(true); try { await auth.register(name, email, password, filiation, avatar); } catch(e) { setIsRegistering(false); throw e; } }`
     - Use `getValues()` from react-hook-form to read current form data inside the handler
   - Add handler: `handleCharacterClose = () => setShowCharacterSelect(false)`
   - Render `<CharacterSelect>` conditionally: `{showCharacterSelect && <CharacterSelect onConfirm={handleCharacterConfirm} onClose={handleCharacterClose} isLoading={isRegistering} />}`
   - Import `CharacterSelect` from `@/components/character-select`
   - Import `useState` (likely already imported)
   - Keep the "Set Sail!" submit button text unchanged — it now either registers (marine) or opens overlay (pirate)

## Verification

```bash
cd /home/perico/work/last-island/client && npm run build
```
— Must pass with zero new errors (exit 0)

```bash
cd /home/perico/work/last-island/client && npm run lint
```
— Expect ≤9 pre-existing issues, no new ones introduced

```bash
cd /home/perico/work/last-island/service && mvn test -q
```
— Must pass 79/79 (no backend changes, sanity check)

### Manual checks
- Open `/register`, select MARINE filiation, submit → registers directly (no overlay)
- Open `/register`, select PIRATE filiation, submit → full-screen character select appears
- In overlay: 6 parallelogram panels visible with character images, names, flavor text
- Click a character → it brightens, others darken, laugh audio plays
- "Set Sail!" confirm button appears after selection
- Click confirm → user is registered with selected avatar, redirected to dashboard
- Press Escape in overlay → returns to form, form data preserved
- Click "← Back" → same as Escape

## Rollback

```bash
cd /home/perico/work/last-island
git checkout -- client/src/app/\(auth\)/register/page.tsx client/src/styles/globals.css
rm -f client/src/components/character-select.tsx
```
