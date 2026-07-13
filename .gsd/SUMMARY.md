# GSD Summary

## 2026-07-01T17:46 — Design System + Dark Nautical Theme

Implementer: Created 9 UI components (Button, Input, Alert, Card, Badge, Spinner, Skeleton, PageHeader, EmptyState) in `src/components/ui/`. Rewrote `globals.css` with full token system. Refactored all screens to use shared components. Applied dark-only nautical One Piece palette (deep ocean navy, gold primary, sea green success, cannon red danger). Removed all dark: prefixes (single theme). Added emoji filiation selector on register page.

Commit: d624378

## 2026-07-01T17:49 — One Piece Themed Screens + Stats Card

Implementer: Rewrote game-over-panel with rich stats card (emoji icons, VS layout, color-highlighted better stats, winner banner). Replaced generic waiting screens with One Piece flavored copy (⛵ "Scanning the horizon", 🧭 "Fleet deployed, Captain!", animated status pills).

Commit: ff1b701

## 2026-07-13T12:00 — Migrate JWT storage from localStorage to httpOnly cookies

Implementer: Migrated JWT token management from client-side localStorage to backend-set httpOnly cookies. Created `TokenPair.java` (+8) and `AuthResult.java` (+8). Refactored `AuthService.java` to return `AuthResult` instead of `AuthResponse`. Rewrote `AuthController.java` (+110) to set/clear httpOnly cookies and added POST `/auth/logout`. Updated `JwtAuthenticationFilter.java` to read `access_token` cookie as fallback (removed `?token=` query param). Updated `SecurityConfig` CORS (already had `allowCredentials: true`). Added `app.cookie.secure` property to dev/prod configs. On frontend: gutted `auth-storage.ts`, removed token provider/header injection from `client.ts` (added `credentials: "include"`), updated `auth.ts` (cookie-based refresh, added `logout()`), rewrote `auth-context.tsx` (hydrate via `/auth/me`, logout calls backend), simplified `use-game-events.ts` (no token param, `withCredentials: true`), removed `RefreshRequest` and token fields from types.

Files changed: `AuthController.java`, `AuthResponse.java`, `AuthService.java`, `TokenPair.java` (new), `AuthResult.java` (new), `JwtAuthenticationFilter.java`, `application-dev.properties`, `application-prod.properties`, `auth-storage.ts`, `client.ts`, `auth.ts`, `index.ts`, `auth-context.tsx`, `use-game-events.ts`, `api.ts` (interfaces)

Reviewer: PASS — service-build ✓, service-test 44/44 ✓, client-build ✓, client-lint 2 pre-existing errors (not introduced), no localStorage usage
Commit: uncommitted

## 2026-07-13T12:24 — Replace Next.js rewrites with App Router route handler proxy

Implementer: Created `client/src/app/api/[...path]/route.ts` (+79) — catch-all proxy route handler that forwards GET/POST/PUT/DELETE to Spring Boot backend at localhost:8081/api/v1/*, preserving Set-Cookie headers via `getSetCookie()`, forwarding request cookies, and streaming SSE responses. Removed `rewrites()` from `client/next.config.ts` (net -8 lines). Build passes, lint has same 2 pre-existing errors (none introduced).

Files changed: `client/src/app/api/[...path]/route.ts` (created, +79), `client/next.config.ts` (modified, net -8)

Reviewer: PASS — client-build ✓, client-lint 2 pre-existing errors (not introduced), no new errors
Commit: uncommitted

## 2026-07-13T12:24 — Replace Next.js rewrites with App Router route handler proxy

Implementer: Created `client/src/app/api/[...path]/route.ts` (+79) — catch-all proxy route handler that forwards GET/POST/PUT/DELETE to Spring Boot backend at localhost:8081/api/v1/*, preserving Set-Cookie headers via `getSetCookie()`, forwarding request cookies, and streaming SSE responses. Removed `rewrites()` from `client/next.config.ts` (net -8 lines). Build passes, lint has same 2 pre-existing errors (none introduced).

Files changed: `client/src/app/api/[...path]/route.ts` (created, +79), `client/next.config.ts` (modified, net -8)

Reviewer: PASS — client-build ✓, client-lint 2 pre-existing errors (not introduced), no new errors
Commit: uncommitted

## 2026-07-13T12:57 — Add Battle Log (Game History) Feature

Implementer: Created `BattleLogEntryResponse.java` (+14) — Java record DTO. Modified `GameResultRepository.java` (+20) — added JPQL fetch-join query with Pageable. Created `BattleLogService.java` (+28) — service calling repository and mapping via GameMapper. Added `toBattleLogEntry` and `formatDuration` methods to `GameMapper.java` (+40). Modified `GameController.java` (+10) — injected BattleLogService, added GET `/history` endpoint. Created `BattleLogServiceTest.java` (+190) — 3 unit tests (victory, defeat, empty). Added `BattleLogEntryResponse` interface to `client/src/interfaces/api.ts` (+10). Added `getBattleLog()` function to `client/src/lib/api/games.ts` (+5). Re-exported in `client/src/lib/api/index.ts` (+2). Added Battle Log section to `client/src/app/page.tsx` (+50) — state, fetch, loading/empty/populated renders with Badge.

Files changed: `BattleLogEntryResponse.java` (created), `GameResultRepository.java` (modified), `BattleLogService.java` (created), `GameMapper.java` (modified), `GameController.java` (modified), `BattleLogServiceTest.java` (created), `client/src/interfaces/api.ts` (modified), `client/src/lib/api/games.ts` (modified), `client/src/lib/api/index.ts` (modified), `client/src/app/page.tsx` (modified)

Reviewer: PASS — service-build ✓, service-test 47/47 ✓ (incl. BattleLogServiceTest 3/3), client-build ✓, client-lint 3 pre-existing issues (none introduced)
Commit: uncommitted

## 2026-07-13T14:30 — Add Ranking Leaderboard Feature

Implementer: Created `LeaderboardEntryResponse.java` (+11) — Java record with position, name, filiation, wins, rank, isCurrentUser. Created `LeaderboardResponse.java` (+9) — Java record wrapping entries list and nullable currentUserEntry. Modified `UserRepository.java` (+16) — added `findTop10ByOrderByWinsDescNameAsc()`, `findTop10ByFiliationOrderByWinsDescNameAsc()`, and two JPQL `@Query` methods (`countUsersAhead`, `countUsersAheadByFiliation`) for tie-breaking position computation. Created `LeaderboardService.java` (+83) — `@Service` with `getLeaderboard(UUID, String)` method that fetches top 10, maps to DTOs with positions, and computes current user position when not in top 10. Created `UserController.java` (+27) — `@RestController @RequestMapping("/users")` with GET `/leaderboard` endpoint. Created `LeaderboardServiceTest.java` (+125) — 4 unit tests covering all/filtered queries, current user in/out of top 10. Modified `client/src/interfaces/api.ts` (+12) — added `LeaderboardEntryResponse` and `LeaderboardResponse` interfaces. Created `client/src/lib/api/users.ts` (+6) — `getLeaderboard(filiation)` function. Modified `client/src/lib/api/index.ts` (+3) — re-exported `getLeaderboard` and leaderboard types. Modified `client/src/app/page.tsx` (+95) — added leaderboard state, fetch effect, tabbed UI section (All/Pirates/Marines) with entry cards showing position/filiation emoji/name/rank/wins, current user highlighted with ring styling.

Files changed: `LeaderboardEntryResponse.java` (created), `LeaderboardResponse.java` (created), `UserRepository.java` (modified), `LeaderboardService.java` (created), `UserController.java` (created), `LeaderboardServiceTest.java` (created), `client/src/interfaces/api.ts` (modified), `client/src/lib/api/users.ts` (created), `client/src/lib/api/index.ts` (modified), `client/src/app/page.tsx` (modified)

Reviewer: PASS — service-build ✓, service-test 51/51 ✓ (incl. LeaderboardServiceTest 4/4), client-build ✓, client-lint 3 pre-existing issues (none introduced)
Commit: uncommitted

## 2026-07-13T15:20 — Restructure Dashboard into 60/40 Two-Column Grid Layout

Implementer: Rewrote `client/src/app/page.tsx` (516 lines, full JSX restructure) into responsive 60/40 two-column grid (`lg:grid-cols-[3fr_2fr]`). Left column: Leaderboard with Olympic podium (top 3 as elevated cards with gold/silver/bronze ring glows using `next/image` + skull-icon.png, [2nd][1st][3rd] layout) + compact entries 4-10 list + currentUserEntry divider. Battle Log below with compact rows (Badge + opponent + date + → indicator, cursor-pointer for future modal). Right column: "Battle Station" with big Start Battle button, 5-item scrollable game list (`max-h-[320px] overflow-y-auto`), compact join-by-token form. Mobile: games column renders first via `order-first lg:order-none`. Removed pagination state/handlers (`currentPage`, `setCurrentPage`, `handlePrevPage`, `handleNextPage`), changed `listGames` to `{ page: 0, size: 5 }`. Fixed `ring-accent-primary` → `ring-primary` bug. Modified `client/src/styles/globals.css` (+9 lines) — added `--color-gold`, `--color-silver`, `--color-bronze` tokens to `:root` and `@theme inline`.

Files changed: `client/src/app/page.tsx` (rewritten, net +260), `client/src/styles/globals.css` (modified, net +9)

Reviewer: PASS — client-build ✓, client-lint 3 pre-existing issues (none introduced), skull-icon.png referenced correctly
Commit: uncommitted