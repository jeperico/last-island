# Frontend: Audio System (Sound Manager, Laugh/Scream/Soundtrack Triggers, Mute Setting)

## Objective

Add a complete audio system with a SoundProvider context, useSound hook, placeholder MP3 files, battle audio triggers (laugh on SUNK/victory, scream on ship sunk/defeat, looping soundtrack during battle), mute toggle in settings, and browser autoplay handling.

## Files to touch

- create `client/src/lib/sound/sound-context.tsx` — SoundProvider + useSound hook
- create `client/src/lib/sound/index.ts` — barrel export
- modify `client/src/app/providers.tsx` — wrap children with SoundProvider
- modify `client/src/app/game/[token]/battle-screen.tsx` — play laugh on SUNK result from handleFire
- modify `client/src/app/game/[token]/page.tsx` — play scream on SSE SHOT_RECEIVED with SUNK, play laugh/scream on game over, start/stop soundtrack lifecycle
- modify `client/src/app/settings/page.tsx` — add Sound section with mute toggle
- create `client/public/audio/default-laugh.mp3` — silent placeholder
- create `client/public/audio/default-scream.mp3` — silent placeholder
- create `client/public/audio/default-soundtrack.mp3` — silent placeholder
- create `client/public/avatars/luffy/laugh.mp3` — silent placeholder
- create `client/public/avatars/luffy/scream.mp3` — silent placeholder
- create `client/public/avatars/luffy/soundtrack.mp3` — silent placeholder
- create `client/public/avatars/zoro/laugh.mp3` — silent placeholder
- create `client/public/avatars/zoro/scream.mp3` — silent placeholder
- create `client/public/avatars/zoro/soundtrack.mp3` — silent placeholder
- create `client/public/avatars/robin/laugh.mp3` — silent placeholder
- create `client/public/avatars/robin/scream.mp3` — silent placeholder
- create `client/public/avatars/robin/soundtrack.mp3` — silent placeholder
- create `client/public/avatars/chopper/laugh.mp3` — silent placeholder
- create `client/public/avatars/chopper/scream.mp3` — silent placeholder
- create `client/public/avatars/chopper/soundtrack.mp3` — silent placeholder
- create `client/public/avatars/nami/laugh.mp3` — silent placeholder
- create `client/public/avatars/nami/scream.mp3` — silent placeholder
- create `client/public/avatars/nami/soundtrack.mp3` — silent placeholder
- create `client/public/avatars/ace/laugh.mp3` — silent placeholder
- create `client/public/avatars/ace/scream.mp3` — silent placeholder
- create `client/public/avatars/ace/soundtrack.mp3` — silent placeholder

## Steps

1. **Create placeholder MP3 files** — Generate minimal valid silent MP3 files (a single MPEG audio frame, ~144 bytes). Create all 21 placeholder files:
   - `client/public/audio/default-laugh.mp3`, `default-scream.mp3`, `default-soundtrack.mp3`
   - `client/public/avatars/{luffy,zoro,robin,chopper,nami,ace}/{laugh,scream,soundtrack}.mp3`
   - Use a base64-encoded minimal valid MP3 frame copied to all files (they can be identical silent frames for now).

2. **Create `client/src/lib/sound/sound-context.tsx`** — Implement:
   - `"use client"` directive
   - `SoundContext` with createContext
   - `SoundProvider` component that:
     - Reads `localStorage.getItem("sound_muted")` on mount to initialize `isMuted` state
     - Maintains a `soundtrackRef` (useRef<HTMLAudioElement | null>) for the currently-playing soundtrack
     - Maintains a `userInteractedRef` (useRef<boolean>) to track whether user has interacted (for autoplay policy)
     - Registers a one-time `click`/`touchstart`/`keydown` listener on `document` to set `userInteractedRef.current = true` and attempt to resume paused soundtrack
     - Provides functions:
       - `playLaugh(avatar: string | null)`: resolves audio path, creates Audio, plays (respecting mute)
       - `playScream(avatar: string | null)`: same pattern
       - `playSoundtrack(avatar: string | null)`: creates Audio with `loop = true`, stores in ref, attempts `.play()`, catches NotAllowedError gracefully (will resume on user interaction)
       - `stopSoundtrack()`: pauses and clears the soundtrackRef
       - `toggleMute()`: toggles state, writes to localStorage, mutes/unmutes active soundtrack
       - `isMuted`: boolean state
   - Audio path resolution helper: `getAudioPath(avatar: string | null, type: "laugh" | "scream" | "soundtrack")` → if avatar is non-null, return `/avatars/${avatar.toLowerCase()}/${type}.mp3`; else return `/audio/default-${type}.mp3`
   - `useSound()` hook that throws if used outside provider
   - Export `SoundProvider` and `useSound`

3. **Create `client/src/lib/sound/index.ts`** — Barrel export:
   ```ts
   export { SoundProvider, useSound } from "./sound-context";
   ```

4. **Modify `client/src/app/providers.tsx`** — Import `SoundProvider` from `@/lib/sound`, wrap children:
   ```tsx
   import { SoundProvider } from "@/lib/sound";
   
   export function Providers({ children }: { children: React.ReactNode }) {
     return (
       <AuthProvider>
         <SoundProvider>{children}</SoundProvider>
       </AuthProvider>
     );
   }
   ```

5. **Modify `client/src/app/game/[token]/battle-screen.tsx`** — Add audio trigger for laugh on SUNK:
   - Import `useSound` from `@/lib/sound`
   - Call `const { playLaugh } = useSound()` at component top
   - In `handleFire`, after `const response = await fireShot(...)`, add:
     ```ts
     if (response.result === "SUNK") {
       playLaugh(myAvatar);
     }
     ```

6. **Modify `client/src/app/game/[token]/page.tsx`** — Add soundtrack lifecycle + scream/game-over audio:
   - Import `useSound` from `@/lib/sound`
   - Call `const { playSoundtrack, stopSoundtrack, playLaugh, playScream } = useSound()` at component top
   - Add a `prevPhaseRef = useRef<GamePhase | null>(null)` to detect phase transitions
   - Add `useEffect` for soundtrack lifecycle:
     ```ts
     useEffect(() => {
       if (gameState?.phase === "IN_PROGRESS") {
         const myAvatar = gameState.bluePlayerName === user?.name
           ? gameState.bluePlayerAvatar : gameState.redPlayerAvatar;
         playSoundtrack(myAvatar);
       }
       return () => { stopSoundtrack(); };
     }, [gameState?.phase === "IN_PROGRESS"]);
     ```
   - Add `useEffect` for game-over audio (using prevPhaseRef to only fire once on transition):
     ```ts
     useEffect(() => {
       if (prevPhaseRef.current === "IN_PROGRESS" && gameState?.phase === "FINISHED" && user) {
         const myAvatar = gameState.bluePlayerName === user.name
           ? gameState.bluePlayerAvatar : gameState.redPlayerAvatar;
         stopSoundtrack();
         if (gameState.winnerName === user.name) {
           playLaugh(myAvatar);
         } else {
           playScream(myAvatar);
         }
       }
       prevPhaseRef.current = gameState?.phase ?? null;
     }, [gameState?.phase]);
     ```
   - Modify `onShotReceived` SSE handler to play scream on SUNK:
     ```ts
     onShotReceived: (data) => {
       if (data.result === "SUNK") {
         const myAvatar = gameState?.bluePlayerName === user?.name
           ? gameState?.bluePlayerAvatar : gameState?.redPlayerAvatar;
         playScream(myAvatar ?? null);
       }
       refetchGame();
     },
     ```
   - Modify `onGameOver` SSE handler to play audio (for cases where opponent fires winning shot):
     ```ts
     onGameOver: (data) => {
       stopSoundtrack();
       const myAvatar = gameState?.bluePlayerName === user?.name
         ? gameState?.bluePlayerAvatar : gameState?.redPlayerAvatar;
       if (data.winnerName === user?.name) {
         playLaugh(myAvatar ?? null);
       } else {
         playScream(myAvatar ?? null);
       }
       refetchGame();
     },
     ```
   - Add `stopSoundtrack()` in `onSurrender`, `onTurnExpired` (that triggers game over), `onGameExpired` handlers.

7. **Modify `client/src/app/settings/page.tsx`** — Add Sound section:
   - Import `useSound` from `@/lib/sound`
   - Call `const { isMuted, toggleMute } = useSound()` inside the component
   - Add a new `<Card className="mb-6">` section between the Avatar/Filiation section and the Logout section:
     ```tsx
     <Card className="mb-6">
       <h3 className="text-lg font-semibold text-text-primary mb-4">
         Sound
       </h3>
       <div className="flex items-center justify-between">
         <div>
           <p className="text-sm text-text-secondary">Sound effects & music</p>
           <p className="text-xs text-text-muted">
             Laughs, screams, and battle soundtrack
           </p>
         </div>
         <button
           type="button"
           onClick={toggleMute}
           className={[
             "relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer",
             isMuted ? "bg-surface-secondary" : "bg-primary",
           ].join(" ")}
         >
           <span
             className={[
               "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
               isMuted ? "translate-x-1" : "translate-x-6",
             ].join(" ")}
           />
         </button>
       </div>
     </Card>
     ```

## Verification

```bash
cd client && npm run build
```
Expected: Build passes with no new TypeScript errors.

```bash
cd client && npm run lint
```
Expected: Same 9 pre-existing lint issues, no new ones introduced.

```bash
# Verify placeholder audio files exist
ls client/public/audio/default-laugh.mp3 client/public/audio/default-scream.mp3 client/public/audio/default-soundtrack.mp3
ls client/public/avatars/luffy/laugh.mp3 client/public/avatars/zoro/laugh.mp3 client/public/avatars/robin/laugh.mp3 client/public/avatars/chopper/laugh.mp3 client/public/avatars/nami/laugh.mp3 client/public/avatars/ace/laugh.mp3
ls client/public/avatars/luffy/scream.mp3 client/public/avatars/luffy/soundtrack.mp3
```
Expected: All files exist.

```bash
# Verify sound system wiring
grep -r "useSound\|SoundProvider\|sound-context" client/src/ --include="*.ts" --include="*.tsx"
```
Expected: References in `providers.tsx`, `sound-context.tsx`, `index.ts`, `battle-screen.tsx`, `page.tsx` (game), `settings/page.tsx`.

Manual checks:
- Settings page renders Sound section with toggle
- Battle page does not throw autoplay errors in console (graceful handling)
- localStorage key `sound_muted` is persisted after toggling

## Rollback

```bash
rm -rf client/src/lib/sound/
rm -rf client/public/audio/
rm -f client/public/avatars/{luffy,zoro,robin,chopper,nami,ace}/{laugh,scream,soundtrack}.mp3
git checkout -- client/src/app/providers.tsx client/src/app/game/\[token\]/battle-screen.tsx client/src/app/game/\[token\]/page.tsx client/src/app/settings/page.tsx
```
