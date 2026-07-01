# State

## Position
Working on: Add OpenAPI/Swagger documentation (springdoc-openapi) — PLAN.md written, ready for implementer

## Decisions
- 2026-06-30: Spring Boot 4.1 + Java 21 + PostgreSQL chosen as stack
- 2026-06-30: Server-authoritative architecture — no opponent state leaks
- 2026-06-30: All IDs are UUID (@GeneratedValue UUID strategy)
- 2026-06-30: BaseEntity in com.last_island.api.common.entity (id, createdAt, updatedAt, isActive)
- 2026-06-30: Single ShipType enum with filiation field (10 values: 5 pirate + 5 marine)
- 2026-06-30: PirateRank/MarineRank as polymorphic enums, stored as String in DB
- 2026-06-30: User stores totalShots + totalHits for lifetime accuracy (no per-game accuracy)
- 2026-06-30: Rank progression based on bounty (deferred to MatchMaking microservice)
- 2026-06-30: Board belongs to one owner; shots received on that board
- 2026-06-30: Shot.result = MISS/HIT/SUNK (stored, not derived)
- 2026-06-30: Ship.hits = int counter; isSunk() = hits == type.size
- 2026-06-30: Game.currentTurn references User
- 2026-06-30: GamePhase enum: WAITING_OPPONENT, PLACING_SHIPS, IN_PROGRESS, FINISHED
- 2026-06-30: GameResult = separate entity (winner, loser, turns)
- 2026-06-30: Coordinate = int row + int col fields
- 2026-06-30: Package structure: domain/{user,game,board}/{entity,enum}; common/entity for BaseEntity
- 2026-06-30: Auth = JWT (1h access token + refresh token), BCrypt password hashing
- 2026-06-30: User gets email + password_hash fields (V2 migration)
- 2026-06-30: Default rank on register: ROOKIE (pirate), MARINHEIRO (marine)
- 2026-06-30: Security package: com.last_island.api.infrastructure.security/{config,filter,jwt,principal}
- 2026-06-30: Domain subfolders: controller, dto, entity, enums, mapper, repository, service
- 2026-06-30: SecurityConfig with actuatorFilterChain + securityFilterChain (cors withDefaults)
- 2026-06-30: JwtAuthenticationFilter in filter/
- 2026-06-30: JwtClaims (record) + JwtConfig (jwtDecoder) in jwt/
- 2026-06-30: AuthenticatedUser implements UserDetails in principal/
- 2026-06-30: REQ-3: One active game per player at a time
- 2026-06-30: REQ-3: Paginated game list with common/mapper/PageMapper
- 2026-06-30: REQ-3: Random first turn on join
- 2026-06-30: REQ-3: Game has a numeric friendly token (e.g. 6-digit) for joining instead of UUID
- 2026-06-30: REQ-3: Join endpoint is POST /games/{token}
- 2026-06-30: REQ-3: No cancel/leave for v1

## Blockers
(none)

## Last verification
- PASS at 2026-07-01T14:46:48-03:00 — OpenAPI/Swagger: compile exit 0, 36 tests pass, OpenApiConfig present, SecurityConfig permits swagger paths, @Tag on both controllers, springdoc properties set
