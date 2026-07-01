# REQ-1: Scaffold Next.js 15 + TypeScript + Tailwind CSS 4 + Vercel config

## Objective

Bootstrap the client directory with a working Next.js 15 App Router project using TypeScript, Tailwind CSS 4, and Vercel-ready configuration so that subsequent features have a buildable, deployable foundation.

## Files to touch

- `package.json` — create (via create-next-app)
- `tsconfig.json` — create (via create-next-app)
- `next.config.ts` — create (via create-next-app)
- `postcss.config.mjs` — create (via create-next-app, if generated)
- `eslint.config.mjs` — create (via create-next-app)
- `.gitignore` — create (via create-next-app), then modify to add `.gsd/`
- `src/app/layout.tsx` — create (via create-next-app)
- `src/app/page.tsx` — create (via create-next-app)
- `src/app/globals.css` — create (via create-next-app; uses `@import "tailwindcss"`)
- `public/` — create (via create-next-app)
- `.env.local.example` — create (manual; env var template)
- `README.md` — create (via create-next-app), then replace with project-specific content

## Steps

1. **Verify Node.js version** — Run `node --version` and confirm >= 18.18. Abort if not met.

2. **Run create-next-app** from the monorepo root:
   ```bash
   cd /home/perico/work/last-island
   npx create-next-app@latest client \
     --typescript \
     --tailwind \
     --eslint \
     --app \
     --src-dir \
     --import-alias "@/*" \
     --turbopack \
     --skip-install
   ```
   If the command fails because the `client/` directory already contains `.gsd/`, temporarily move `.gsd/` out, run the command, then move it back.

3. **Install dependencies**:
   ```bash
   cd /home/perico/work/last-island/client
   npm install
   ```

4. **Verify Tailwind v4 pattern** — Confirm `src/app/globals.css` contains `@import "tailwindcss"` (not `@tailwind base`). Confirm `package.json` has `tailwindcss` version 4.x.

5. **Append `.gsd/` to `.gitignore`**:
   ```
   # GSD workflow
   .gsd/
   ```

6. **Create `.env.local.example`**:
   ```
   # Backend API base URL
   NEXT_PUBLIC_API_URL=http://localhost:8080
   ```

7. **Replace `README.md`** with minimal project-specific content:
   ```markdown
   # Last Island — Client

   Web frontend for the Last Island multiplayer naval battle game.

   ## Stack

   - Next.js 15 (App Router)
   - React 19
   - TypeScript
   - Tailwind CSS 4

   ## Getting Started

   ```bash
   npm install
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

   ## Environment Variables

   Copy `.env.local.example` to `.env.local` and fill in values.

   ## Deploy

   Deployed to Vercel. Set Root Directory to `client` in project settings.
   ```

8. **Verify build passes**:
   ```bash
   npm run build
   ```

## Verification

```bash
# 1. Node version check
node --version  # expect v18.18+ or v20+

# 2. Dependencies installed
test -d node_modules && echo "OK" || echo "FAIL: node_modules missing"

# 3. Build succeeds with zero errors
npm run build

# 4. Tailwind v4 CSS pattern
grep -q '@import "tailwindcss"' src/app/globals.css && echo "OK: Tailwind v4" || echo "FAIL: wrong Tailwind pattern"

# 5. Tailwind version in package.json is 4.x
grep '"tailwindcss"' package.json | grep -q '"4\.' && echo "OK: tailwindcss 4.x" || grep '"tailwindcss"' package.json

# 6. .gitignore contains .gsd/
grep -q '\.gsd/' .gitignore && echo "OK: .gsd excluded" || echo "FAIL: .gsd not in .gitignore"

# 7. .env.local.example exists
test -f .env.local.example && echo "OK" || echo "FAIL: .env.local.example missing"

# 8. Dev server starts (manual check — start and confirm http://localhost:3000 renders)
npm run dev
# Visit http://localhost:3000, confirm page renders with Tailwind styles. Ctrl+C to stop.
```

## Rollback

```bash
# Remove all scaffolded files (keep .gsd/ intact)
cd /home/perico/work/last-island/client
find . -maxdepth 1 -not -name '.' -not -name '.gsd' -exec rm -rf {} +
```
