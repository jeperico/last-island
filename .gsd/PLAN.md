# Frontend: Avatar Selection Step in Registration Flow

## Objective

Add a conditional avatar selection grid to the registration page that appears when filiation is PIRATE, integrating with the existing react-hook-form + Zod setup and passing the selected avatar to the backend.

## Files to touch

- `client/src/lib/validations/register.ts` — modify (add optional avatar field to Zod schema)
- `client/src/interfaces/api.ts` — modify (add `avatar` field to `RegisterRequest` interface)
- `client/src/interfaces/auth.ts` — modify (add `avatar` param to register signature)
- `client/src/lib/auth/auth-context.tsx` — modify (accept and pass avatar in register callback)
- `client/src/app/(auth)/register/page.tsx` — modify (add avatar grid UI, clear avatar on filiation switch, pass avatar on submit)

## Steps

1. **Extend Zod schema** — In `client/src/lib/validations/register.ts`, add `avatar: z.string().nullable().optional()` to the `.object({...})` fields (after `filiation`). The `RegisterFormData` type will automatically include it.

2. **Add avatar to RegisterRequest interface** — In `client/src/interfaces/api.ts`, add `avatar?: string | null;` to the `RegisterRequest` interface (after `filiation`).

3. **Update auth context interface** — In `client/src/interfaces/auth.ts`, add `avatar?: string | null` as a 5th parameter to the `register` method signature:
   ```ts
   register: (
     name: string,
     email: string,
     password: string,
     filiation: string,
     avatar?: string | null,
   ) => Promise<void>;
   ```

4. **Update auth context implementation** — In `client/src/lib/auth/auth-context.tsx`, update the `register` callback:
   - Add `avatar?: string | null` parameter (after `filiation`)
   - Include `avatar` in the object passed to `registerApi`: `{ name, email, password, filiation: filiation as "PIRATE" | "MARINE", avatar: avatar ?? null }`

5. **Add avatar grid to registration page** — In `client/src/app/(auth)/register/page.tsx`:

   a. Add `AVATAR_OPTIONS` constant at top of file (same array from settings page):
   ```ts
   const AVATAR_OPTIONS = [
     { key: "LUFFY", name: "Luffy", image: "/avatars/luffy/profile.svg" },
     { key: "ZORO", name: "Zoro", image: "/avatars/zoro/profile.svg" },
     { key: "ROBIN", name: "Robin", image: "/avatars/robin/profile.svg" },
     { key: "CHOPPER", name: "Chopper", image: "/avatars/chopper/profile.svg" },
     { key: "NAMI", name: "Nami", image: "/avatars/nami/profile.svg" },
     { key: "ACE", name: "Ace", image: "/avatars/ace/profile.svg" },
   ] as const;
   ```

   b. Add `avatar` to the `watch` call: `const avatar = watch("avatar");`

   c. In the Marine filiation toggle `onClick`, add `setValue("avatar", null)` to clear avatar when switching to Marine.

   d. Insert a new conditional section between the filiation `</fieldset>` and the submit `<Button>`:
   ```tsx
   {filiation === "PIRATE" && (
     <fieldset>
       <legend className="text-sm font-medium text-text-secondary mb-2">
         Choose Your Captain
       </legend>
       <div className="grid grid-cols-3 gap-3">
         {AVATAR_OPTIONS.map((opt) => (
           <button
             key={opt.key}
             type="button"
             onClick={() => setValue("avatar", avatar === opt.key ? null : opt.key)}
             className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
               avatar === opt.key
                 ? "border-primary ring-2 ring-primary bg-primary/10"
                 : "border-border hover:border-primary/50"
             }`}
             aria-pressed={avatar === opt.key}
           >
             {/* eslint-disable-next-line @next/next/no-img-element */}
             <img
               src={opt.image}
               alt={opt.name}
               className="w-16 h-16 rounded-full object-cover"
             />
             <span className="text-sm font-medium text-text-secondary">
               {opt.name}
             </span>
           </button>
         ))}
       </div>
       <p className="text-xs text-text-secondary mt-2">
         Optional — you can pick later in settings
       </p>
     </fieldset>
   )}
   ```

   e. Update the `onValid` submit handler to pass avatar:
   ```ts
   await auth.register(data.name, data.email, data.password, data.filiation, data.avatar ?? null);
   ```

## Verification

```bash
cd /home/perico/work/last-island/client && npm run build
```
Expect: clean build, no TypeScript errors.

```bash
cd /home/perico/work/last-island/client && npm run lint
```
Expect: ≤7 pre-existing issues, no new errors introduced.

```bash
cd /home/perico/work/last-island/service && mvn test -q
```
Expect: all tests pass (no backend changes made).

Manual checks:
- On register page with PIRATE selected → avatar grid visible with 6 options
- Click an avatar → ring highlight appears; click again → deselects
- Switch filiation to MARINE → avatar grid disappears
- Switch back to PIRATE → avatar grid reappears with no selection
- Submit with avatar selected → request body includes `avatar: "LUFFY"` (or whichever)
- Submit without avatar selected → request body includes `avatar: null`
- Submit as MARINE → no avatar field or `avatar: null` in body

## Rollback

```bash
cd /home/perico/work/last-island
git checkout -- client/src/lib/validations/register.ts client/src/interfaces/api.ts client/src/interfaces/auth.ts client/src/lib/auth/auth-context.tsx "client/src/app/(auth)/register/page.tsx"
```
