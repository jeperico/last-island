# GSD Summary

## 2026-07-01T10:26 — Refactor Portuguese enum values to English + Flyway V4 migration

Implementer: modified `Filiation.java` (-2/+2 values), `PirateRank.java` (-2/+2 renames), `MarineRank.java` (-7/+6 values), `ShipType.java` (-5/+5 entries + Filiation refs), `AuthService.java` (1 line); created `V4__rename_enum_values_to_english.sql` (+23 lines). Net: 5 files modified, 1 file created.

Reviewer: PASS — compile exit 0, grep for old values returns 0 matches, V4 migration exists, all enum counts correct (2/6/6/10)

Commit: 238066a

## 2026-07-01T11:32 — REQ-5: Turn-based shooting mechanics

Implementer: created `ShotRequest.java` (+3 lines), `ShotResponse.java` (+5 lines); modified `BoardService.java` (+90 lines — fireShot method with validation, resolution, stats), `GameController.java` (+9 lines — endpoint + imports). Net: 2 files created, 2 files modified.

Reviewer: PASS — compile exit 0, symbols present in all expected files, code review confirms: shot stored on opponentBoard, turn switches to opponent, duplicate check on opponent shots, coordinates validated 0-9, sunkShipType only when SUNK, HORIZONTAL/VERTICAL cell iteration correct, attacker totalShots/totalHits updated

Commit: f2734fa

## 2026-07-01T11:41 — REQ-6: Fog of War + REQ-7: Win Condition Detection

Implementer: created `GameResultRepository.java` (+9), `ShotCellResponse.java` (+6), `MyBoardResponse.java` (+8), `OpponentBoardResponse.java` (+7), `GameStateResponse.java` (+13); modified `BoardMapper.java` (+52 lines — toMyBoardResponse, toOpponentBoardResponse, toShotCellResponse, findSunkShipTypeAt), `GameMapper.java` (+50 lines — toStateResponse, determineWinner), `GameService.java` (+8 lines — participant validation, return GameStateResponse), `GameController.java` (+2 lines — import + return type), `ShotResponse.java` (+2 fields — gameOver, winnerName), `BoardService.java` (+25 lines — win detection, GameResult creation, wins/losses update, skip turn switch). Net: 5 files created, 6 files modified.

Reviewer: PASS — compile exit 0, tests exit 0, all 9 grep checks pass: no ShipResponse/ships in OpponentBoardResponse, FINISHED set in BoardService, participant 403 validation present, gameOver in ShotResponse, setWins/setLosses in BoardService, GameResultRepository injected, GameStateResponse returned from GameService with myBoard/opponentBoard

Commit: 193eca4

## 2026-07-01T13:50 — REQ-10: Automated unit tests for domain rules

Implementer: created `BoardServicePlaceShipsTest.java` (+321 lines, 11 tests), `BoardServiceFireShotTest.java` (+344 lines, 16 tests), `GameServiceTest.java` (+255 lines, 9 tests). Total: 36 tests covering ship placement validation, shooting mechanics, win condition, game creation/join, and fog of war. All use @ExtendWith(MockitoExtension.class), no @SpringBootTest. Net: 3 files created, 920 lines added.

Reviewer: PASS — 36 tests pass (11+16+9), no @SpringBootTest, 3 MockitoExtension classes, all individual test classes green, BUILD SUCCESS

Commit: 737f1b9

## 2026-07-01T14:18 — Upgrade Makefile with pretty test runner, install, and status targets

Implementer: modified `Makefile` (52→151 lines, net +99). Added SHELL := /bin/bash, replaced test target with full pretty runner (spinner, elapsed time, colors, VERBOSE mode, suite listing, failure logs, signal traps), added install target (./mvnw clean install -DskipTests -q), added status target (docker containers + git info with colors), migrated build and run targets to ./mvnw, updated .PHONY declarations. Net: 1 file modified.

Reviewer: PASS — all 7 verification commands exit 0; make help lists 14 targets (10 original + 4 new), make test shows colored spinner/summary with 36 tests passing (21s), make status/install/build/ps all functional

Commit: 95926d1

## 2026-07-01T14:45 — Add OpenAPI/Swagger Documentation

Implementer: modified `pom.xml` (+4 lines — springdoc dependency), created `OpenApiConfig.java` (+45 lines — metadata, tags, JWT security scheme, tag ordering), modified `SecurityConfig.java` (+2 lines — permit swagger paths), modified `AuthController.java` (+2 lines — @Tag import + annotation), modified `GameController.java` (+2 lines — @Tag import + annotation), modified `application.properties` (+3 lines — springdoc properties). Net: 1 file created, 5 files modified.

Reviewer: PASS — compile exit 0, 36 tests pass, all 5 grep checks confirm: OpenApiConfig has "Last Island API", SecurityConfig permits swagger-ui, @Tag("Auth") on AuthController, @Tag("Battles") on GameController, springdoc.api-docs.path in application.properties

Commit: ebeed37

## 2026-07-02T16:11 — Refactor: Remove one-active-game-per-player constraint

Implementer: modified `GameService.java` (-6 lines — removed 2 hasActiveGame guard clauses), `GameRepository.java` (-3 lines — removed @Query + hasActiveGame method), `GameServiceTest.java` (-24 lines — removed 2 dedicated tests + 2 mocking lines). Net: 3 files modified, -33 lines.

Reviewer: PASS — compile exit 0, 34 tests pass (7+11+16), no hasActiveGame references in src/, no "already have an active battle" message in src/

Commit: 269dcff

## 2026-07-06T15:46 — REQ-8: SSE Real-Time Communication

Implementer: created `GameEvent.java` (+23 lines — event payload record with type constants), `SseConnectionRegistry.java` (+153 lines — emitter storage, event buffering, replay, thread-safe send), `GameEventEmitter.java` (+54 lines — high-level emission service); created `SseConnectionRegistryTest.java` (+188 lines, 10 tests); modified `JwtAuthenticationFilter.java` (+8/-4 lines — query param fallback for /events), `GameController.java` (+18 lines — SSE subscribe endpoint + SseConnectionRegistry injection), `BoardService.java` (+30 lines — post-commit SSE emission for ships placed, shot received, game over), `GameService.java` (+16 lines — post-commit OPPONENT_JOINED emission + validateParticipant method), `application.properties` (+2 lines — async timeout). Net: 4 files created, 5 files modified. Tests: 44 pass (34 existing + 10 new).

Reviewer: PASS — compile exit 0, 44 tests pass (10+7+11+16), all 11 SSE verification checks green, no opponent board data leaks in event payloads, cleanup callbacks registered, events emitted after commit via TransactionSynchronizationManager

Commit: 7552f20
