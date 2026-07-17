# Summary

## 2026-07-15T15:07 — Backend: Add player stats and bounty delta to GameStateResponse

Implementer: created `service/src/main/resources/db/migration/V9__add_bounty_delta_to_games.sql` (+1), modified `Game.java` (+2), `BountyService.java` (+3/-1), `BoardService.java` (+2/-1), `GameService.java` (+2/-1), `GameExpirationService.java` (+2/-1), `GameStateResponse.java` (+6/-2), `GameMapper.java` (+28/-5), `client/src/interfaces/api.ts` (+9)

Reviewer: PASS — 79/79 tests green, client build+lint clean, all 3 call sites verified, 24-field record matches constructor args

Commit: uncommitted

## 2026-07-15T15:18 — Frontend: Redesign game-over screen as VS-style results modal

Implementer: created `client/src/lib/format.ts` (+13), rewrote `client/src/app/game/[token]/game-over-panel.tsx` (+285/-186), modified `client/src/app/game/[token]/page.tsx` (+5/-45), modified `client/src/app/page.tsx` (+2/-12), modified `client/src/app/settings/page.tsx` (+2/-11)

Reviewer: PASS — build ✓, lint 0 new errors (4 pre-existing warnings), createPortal used, all GameStateResponse fields consumed, formatBounty shared across 3 files

Commit: uncommitted

## 2026-07-15T15:53 — Backend: Remove Marine/filiation concept

Implementer: deleted `Filiation.java`, `MarineRank.java`; created `V10__remove_filiation.sql` (+9); rewrote `ShipType.java` (+35/-22), `User.java` (+49/-55), `RegisterRequest.java` (+4/-5), `UpdateProfileRequest.java` (+4/-5), `UserResponse.java` (+6/-8), `LeaderboardEntryResponse.java` (+13/-12), `BountyService.java` (+88/-95), `AuthService.java` (+116/-120), `UserService.java` (+44/-62), `LeaderboardService.java` (+74/-82), `BoardService.java` (+6/-9), `UserMapper.java` (+23/-24), `UserRepository.java` (+25/-31), `UserController.java` (+38/-40), `BountyServiceTest.java` (+116/-132), `UserServiceTest.java` (+89/-127), `LeaderboardServiceTest.java` (+109/-123), `BoardServicePlaceShipsTest.java` (+316/-328), `BoardServiceFireShotTest.java` (+385/-398), `GameServiceTest.java` (+227/-234), `GameServiceSurrenderTest.java` (+240/-251), `GameExpirationServiceTest.java` (+185/-195), `BattleLogServiceTest.java` (+188/-196)

Reviewer: PASS — 73/73 tests green, 0 Filiation/MarineRank imports remain, V10 migration valid SQL, ShipType has 5 @Deprecated marine values

Commit: uncommitted

## 2026-07-15T16:05 — Frontend: Remove Marine/filiation concept

Implementer: modified `client/src/types/game.ts` (-16), `client/src/interfaces/api.ts` (-5), `client/src/interfaces/auth.ts` (-1), `client/src/lib/game/ship-config.ts` (-22), `client/src/lib/game/index.ts` (-2/+1), `client/src/lib/validations/register.ts` (-4), `client/src/lib/validations/auth.ts` (-3), `client/src/lib/auth/auth-context.tsx` (-4/+2), `client/src/lib/api/users.ts` (-4/+2), `client/src/lib/api/index.ts` (-2), `client/src/app/(auth)/register/page.tsx` (-81), `client/src/app/settings/page.tsx` (-73), `client/src/app/page.tsx` (-25), `client/src/app/game/[token]/page.tsx` (-1), `client/src/app/game/[token]/ship-placement.tsx` (-6/+4), `client/src/components/ui/avatar-icon.tsx` (-14)

Reviewer: PASS — build ✓, lint 0 new errors (5 pre-existing), grep 0 filiation/marine matches, register no allegiance fieldset, ShipPlacement uses PIRATE_FLEET directly, leaderboard no tabs

Commit: uncommitted

## 2026-07-15T16:35 — Frontend: Remove 'Join by Token' functionality

Implementer: deleted `client/src/lib/validations/join-game.ts` (-5); modified `client/src/app/page.tsx` (-38): removed useForm/zodResolver imports, joinGameSchema import, useForm call, onJoin handler, Join by Token form section, token display in game cards, Input import; modified `client/src/app/game/[token]/page.tsx` (-9/+2): replaced token-sharing prompt with simple waiting message, removed unused Badge import

Reviewer: PASS — build ✓, lint 0 new errors (4 pre-existing errors same as before), grep 0 matches for joinGameSchema/JoinGameFormData/join-game/Battle Token/Enter game token/Share the token/Join by Token, handleJoinFromList+joinGame still present in lobby, WAITING_OPPONENT shows only "Waiting for an opponent from the Grand Line…"

Commit: uncommitted

## 2026-07-16T14:32 — Allow fleet redeployment during PLACING_SHIPS phase

Implementer: modified `service/src/main/java/com/last_island/api/domain/board/service/BoardService.java` (+2/-2), `service/src/test/java/com/last_island/api/domain/board/service/BoardServicePlaceShipsTest.java` (+17/-10), `client/src/app/game/[token]/page.tsx` (+13/-3)

Reviewer: pending

Commit: uncommitted

## 2026-07-16T14:43 — Improve game waiting pages (WAITING_OPPONENT and Fleet deployed) UI

Implementer: modified `client/src/app/game/[token]/page.tsx` (+45/-20): added AvatarIcon/formatBounty/SHIP_DISPLAY_NAMES/SHIP_SIZES imports, redesigned WAITING_OPPONENT card with player avatar, name, rank, bounty, stats row, divider, and waiting animation; redesigned Fleet deployed card with header row, fleet manifest (ship names + size dots), status pill, and redeploy button

Reviewer: PASS — build ✓, lint 0 errors, all plan elements verified present (avatar, stats, fleet manifest with size dots, wallpaper bg, redeploy button)

Commit: uncommitted

## 2026-07-17T11:10 — Eliminate GET refetch after player's own shot in BattleScreen

Implementer: modified `client/src/app/game/[token]/battle-screen.tsx` (+16/-3): replaced `else` branch's `getGame()` refetch with optimistic local state update (derive `currentTurnPlayerName` from shot result, append shot to `opponentBoard.shotsFired`, reset `turnStartedAt`, clear optimistic shots); added `user` and `gameState` to `useCallback` deps

Reviewer: PASS — build ✓, lint 0 errors, getGame only in game-over+surrender paths, optimistic update appends shot+switches turn correctly, useCallback deps complete

Commit: uncommitted