# Testing Guide

## Overview

Last Island uses **JUnit 5 + Mockito** for unit testing. Tests focus on domain rules (business logic) and run without a database or Spring context — pure, fast, isolated.

## Running Tests

```bash
# From project root
make test

# From service/
./mvnw test

# Run a specific test class
./mvnw test -Dtest=BoardServicePlaceShipsTest

# Run a specific test method
./mvnw test -Dtest=BoardServiceFireShotTest#fireShot_hit_result
```

## Test Structure

```
service/src/test/java/com/last_island/api/domain/
├── board/service/
│   ├── BoardServicePlaceShipsTest.java   (11 tests)
│   └── BoardServiceFireShotTest.java     (16 tests)
└── game/service/
    └── GameServiceTest.java              (9 tests)
```

**Total: 36 tests** (~5 seconds)

## Test Categories

### Ship Placement (`BoardServicePlaceShipsTest`)

| Test | Rule |
|------|------|
| Valid fleet placement | Happy path — 5 ships placed, board persisted |
| Phase validation | Only in `PLACING_SHIPS` phase |
| Participant check | Player must be blue or red board owner |
| Fleet already deployed | Cannot place twice |
| Exactly 5 vessels | Rejects more or fewer |
| Filiation match | Ships must match player's fleet (PIRATE/MARINE) |
| Out of bounds | Row/col must be 0–9 |
| Horizontal overflow | Ship can't extend past column 9 |
| Vertical overflow | Ship can't extend past row 9 |
| No overlaps | Two ships can't occupy the same cell |
| Phase transition | When both players place → `IN_PROGRESS` |

### Shooting Mechanics (`BoardServiceFireShotTest`)

| Test | Rule |
|------|------|
| MISS result | Shot on empty cell |
| HIT result | Shot hits a ship cell |
| SUNK result | Final hit sinks the ship |
| Coordinates validation | Row/col must be 0–9 |
| Phase validation | Only in `IN_PROGRESS` phase |
| Participant check | Player must be in the battle |
| Turn validation | Must be player's turn |
| Duplicate shot | Can't fire on same cell twice |
| Turn switch | After shot, turn passes to opponent |
| Stats update | totalShots++ always, totalHits++ on HIT/SUNK |
| Win condition | All ships sunk → FINISHED + GameResult created |
| Winner stats | Winner gets wins++ |
| Loser stats | Loser gets losses++ |
| Game over response | Returns `gameOver=true` + `winnerName` |
| No turn switch on win | Turn stays when game ends |
| Total turns count | GameResult.turns = sum of both boards' shots |

### Game Service (`GameServiceTest`)

| Test | Rule |
|------|------|
| Create game | Generates 6-digit token, sets WAITING_OPPONENT |
| Active game check | Can't create if player already in a battle |
| Join game | Sets phase to PLACING_SHIPS, assigns random turn |
| Join phase check | Can only join WAITING_OPPONENT games |
| Join own game | Can't join a battle you created |
| Join active check | Can't join if you're already in a battle |
| Get game state | Returns full game with boards |
| Fog of war (my board) | Shows ships + shots received |
| Fog of war (opponent) | Shows only shots fired — no ship positions |

## Approach

### Unit Tests (current)

- **No Spring context** — uses `@ExtendWith(MockitoExtension.class)`
- **Mocked repositories** — `GameRepository`, `UserRepository`, `GameResultRepository`
- **Fast** — full suite in ~5 seconds
- **Focused** — one test class per service method group

### Test Fixtures

Each test class builds its own fixtures inline using Lombok `@Builder`:

```java
User user = User.builder()
    .id(UUID.randomUUID())
    .name("Luffy")
    .filiation(Filiation.PIRATE)
    .build();

Board board = Board.builder()
    .id(UUID.randomUUID())
    .owner(user)
    .ships(new ArrayList<>())
    .shots(new ArrayList<>())
    .build();
```

### Assertion Pattern

Domain rule violations throw `ResponseStatusException`:

```java
ResponseStatusException ex = assertThrows(ResponseStatusException.class,
    () -> boardService.placeShips(token, userId, request));

assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
assertTrue(ex.getReason().contains("expected message fragment"));
```

## What's NOT Tested (yet)

- **Integration tests** — full request → DB → response (requires Testcontainers + PostgreSQL)
- **Auth flow** — register/login/refresh/JWT validation
- **WebSocket** — real-time event delivery
- **Controller layer** — HTTP mapping, serialization (@WebMvcTest)
- **Repository queries** — custom @Query methods (@DataJpaTest)

## Adding New Tests

1. Place test in the matching domain package: `domain/{module}/service/`
2. Name it `{ServiceClass}{MethodGroup}Test.java`
3. Use `@ExtendWith(MockitoExtension.class)` — no `@SpringBootTest`
4. Mock only what the service depends on
5. One `@Test` per rule/scenario
6. Use descriptive method names: `methodName_scenario_expectedResult`

## CI

Tests run on every push via `make test` (see `Makefile`). No external services required.
