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

Reviewer: PASS — verified as part of full suite run (73/73 tests green)

Commit: uncommitted

## 2026-07-16T14:43 — Improve game waiting pages (WAITING_OPPONENT and Fleet deployed) UI

Implementer: modified `client/src/app/game/[token]/page.tsx` (+45/-20): added AvatarIcon/formatBounty/SHIP_DISPLAY_NAMES/SHIP_SIZES imports, redesigned WAITING_OPPONENT card with player avatar, name, rank, bounty, stats row, divider, and waiting animation; redesigned Fleet deployed card with header row, fleet manifest (ship names + size dots), status pill, and redeploy button

Reviewer: PASS — build ✓, lint 0 errors, all plan elements verified present (avatar, stats, fleet manifest with size dots, wallpaper bg, redeploy button)

Commit: uncommitted

## 2026-07-17T11:10 — Eliminate GET refetch after player's own shot in BattleScreen

Implementer: modified `client/src/app/game/[token]/battle-screen.tsx` (+16/-3): replaced `else` branch's `getGame()` refetch with optimistic local state update (derive `currentTurnPlayerName` from shot result, append shot to `opponentBoard.shotsFired`, reset `turnStartedAt`, clear optimistic shots); added `user` and `gameState` to `useCallback` deps

Reviewer: PASS — build ✓, lint 0 errors, getGame only in game-over+surrender paths, optimistic update appends shot+switches turn correctly, useCallback deps complete

Commit: uncommitted

## 2026-07-17T14:32 — 3x bounty gain multiplier for wins

Implementer: modified `service/src/main/java/com/last_island/api/domain/user/service/BountyService.java` (+11/-6): added `gain *= 3;` after ratio branching block, updated Javadoc with 3x progression values; modified `service/src/test/java/com/last_island/api/domain/user/service/BountyServiceTest.java` (+10/-6): renamed equal-match test, updated 4 winner bounty assertions to reflect 3x gains, added winner assertions to rank-demotion test, loser assertions unchanged

Reviewer: PASS — 7/7 BountyServiceTest green, 73/73 full suite green, client build clean, gain*=3 after ratio block & before newWinnerBounty, loss variable untouched by multiplier

Commit: uncommitted

## 2026-07-17T15:10 — Cancel WAITING_OPPONENT game when creator clicks Grand Line

Implementer: modified `service/src/main/java/com/last_island/api/domain/game/service/GameService.java` (+27): added `cancelGame` method; modified `service/src/main/java/com/last_island/api/domain/game/controller/GameController.java` (+7): added `POST /{token}/cancel` endpoint; modified `service/src/test/java/com/last_island/api/domain/game/service/GameServiceTest.java` (+52): added 4 cancel tests + mocks for LobbyEventEmitter/GameEventEmitter/GameResultRepository/BountyService; modified `client/src/lib/api/games.ts` (+4): added `cancelGame` function; modified `client/src/lib/api/index.ts` (+1/-1): added `cancelGame` to barrel export; modified `client/src/app/game/[token]/page.tsx` (+16/-6): conditional cancel button during WAITING_OPPONENT + cancelGame import

Reviewer: PASS — 77/77 tests green, client build+lint clean, cancelGame sets CANCELLED phase with no bounty changes, frontend calls cancel before router.push when WAITING_OPPONENT+creator, 4 backend tests cover happy path+403+400+404

Commit: uncommitted

## 2026-07-17T15:21 — Change game expiration timers

Implementer: modified `service/src/main/java/com/last_island/api/domain/game/service/GameExpirationService.java` (+8/-2): changed TURN_TIMEOUT_SECONDS 120→60, GAME_TIMEOUT_MINUTES 30→5, added PLACING_SHIPS_TIMEOUT_MINUTES=5 constant + handler call in checkExpirations; modified `service/src/main/java/com/last_island/api/domain/game/repository/GameRepository.java` (+3): added findExpiredPlacingShipsGames query; modified `service/src/test/java/com/last_island/api/domain/game/service/GameExpirationServiceTest.java` (+34/-8): updated timing values in 4 existing tests, added mock for new query, added placingShipsExpired test; modified `client/src/components/ui/countdown-timer.tsx` (+1/-1): turnDurationSeconds default 120→60

Reviewer: PASS — 78/78 tests green, client build+lint clean (0 new errors, 5 pre-existing), grep 0 hits for old values (120/30), constants verified: TURN=60s, GAME=5min, PLACING_SHIPS=5min, frontend default=60

Commit: uncommitted

## 2026-07-17T17:22 — Backend: Haki Profile + Point Economy

Implementer: created `service/src/main/resources/db/migration/V11__create_haki_profiles.sql` (+17), `service/src/main/java/com/last_island/api/domain/haki/enums/HakiType.java` (+7), `service/src/main/java/com/last_island/api/domain/haki/entity/HakiProfile.java` (+38), `service/src/main/java/com/last_island/api/domain/haki/repository/HakiProfileRepository.java` (+12), `service/src/main/java/com/last_island/api/domain/haki/dto/HakiProfileResponse.java` (+10), `service/src/main/java/com/last_island/api/domain/haki/dto/HakiUpgradeRequest.java` (+8), `service/src/main/java/com/last_island/api/domain/haki/service/HakiService.java` (+154), `service/src/main/java/com/last_island/api/domain/haki/controller/HakiController.java` (+33), `service/src/test/java/com/last_island/api/domain/haki/service/HakiServiceTest.java` (+299); modified `service/src/main/java/com/last_island/api/domain/user/service/BountyService.java` (+10), `service/src/main/java/com/last_island/api/domain/user/service/AuthService.java` (+4), `service/src/test/java/com/last_island/api/domain/user/service/BountyServiceTest.java` (+5/-3)

Reviewer: PASS — 96/96 tests green, client build clean, all 3 call sites verified, 24-field record matches constructor args

Commit: uncommitted

## 2026-07-17T17:29 — Redesign W.O. (walkover) page for CANCELLED games

Implementer: modified `client/src/app/game/[token]/page.tsx` (+20/-8): replaced plain CANCELLED section with wallpaper background + glass card layout (bg-surface/60, backdrop-blur-md, border, rounded-2xl), 🏳️ emoji at text-6xl, "W.O." heading in text-warning, opponentName message with bold styling, "Return to Grand Line" primary button with router.push("/"); added resumeGlobalSoundtrack() call in phase-change useEffect for CANCELLED phase

Reviewer: PASS — build ✓, lint 0 errors on page.tsx, CANCELLED block has wallpaper bg+glass card+🏳️+W.O.+opponentName message+Return button+resumeGlobalSoundtrack in phase effect

Commit: uncommitted