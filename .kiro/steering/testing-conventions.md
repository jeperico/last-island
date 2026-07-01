# Backend Testing Conventions

This guide defines testing standards for the Last Island service (`service/`). Follow these rules when writing or generating tests.

## Scope

This applies ONLY to backend service tests (Java/Spring Boot). Frontend tests have their own conventions.

## Framework & Style

- **JUnit 5** + **Mockito** for unit tests
- **NO @SpringBootTest** — tests must be fast, no Spring context, no DB
- Use `@ExtendWith(MockitoExtension.class)`
- Use `@Mock` for repositories and external dependencies
- Use `@InjectMocks` for the service under test
- Use **AssertJ** (`assertThat`) for fluent assertions
- Use `assertThrows` for exception checking

## File Organization

```
src/test/java/com/last_island/api/domain/
├── board/service/
│   ├── BoardServicePlaceShipsTest.java
│   └── BoardServiceFireShotTest.java
├── game/service/
│   └── GameServiceTest.java
└── user/service/
    └── AuthServiceTest.java (future)
```

Rules:
- One test class per service **method group** (not per service class if it's large)
- Test class name: `{ServiceClass}{MethodGroup}Test.java`
- Place in the same package as the service: `domain/{module}/service/`

## Test Method Naming

```java
@Test
void methodName_scenario_expectedResult() { }
```

Examples:
```java
void fireShot_hitResult_returnsHitAndIncrementsTotalHits()
void fireShot_notPlayerTurn_throwsConflict()
void placeShips_shipsOverlap_throwsBadRequest()
void createGame_playerHasActiveBattle_throwsConflict()
```

## Test Structure (AAA Pattern)

```java
@Test
void fireShot_missResult_returnsMiss() {
    // Arrange — build fixtures, configure mocks
    Game game = buildGameInProgress();
    when(gameRepository.findByTokenAndIsActiveTrue(TOKEN)).thenReturn(Optional.of(game));
    
    // Act — call the method under test
    ShotResponse response = boardService.fireShot(TOKEN, bluePlayer.getId(), new ShotRequest(9, 9));
    
    // Assert — verify results and interactions
    assertThat(response.result()).isEqualTo(ShotResult.MISS);
    verify(gameRepository).save(game);
}
```

## Fixture Building

Use Lombok `@Builder` for all domain entities. Create private helper methods in each test class:

```java
private User buildUser(String name, Filiation filiation) {
    return User.builder()
        .id(UUID.randomUUID())
        .name(name)
        .filiation(filiation)
        .bounty(0L)
        .wins(0)
        .losses(0)
        .totalShots(0)
        .totalHits(0)
        .build();
}
```

Rules:
- Set ALL fields that the service reads (avoid NPEs)
- Use `new ArrayList<>()` for `@Builder.Default` lists (ships, shots)
- Give entities meaningful names from One Piece (Luffy, Zoro, Akainu, etc.)

## Error Assertion Pattern

Domain rule violations use `ResponseStatusException`:

```java
ResponseStatusException ex = assertThrows(ResponseStatusException.class,
    () -> boardService.fireShot(TOKEN, userId, request));

assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
assertThat(ex.getReason()).contains("not your turn");
```

## What Every Service Test Must Cover

For **write methods** (create/update):
1. Happy path — correct result returned
2. Every validation rule → throws correct status + message
3. State transitions (phase changes)
4. Side effects verified (`.save()` called, stats updated)

For **read methods**:
1. Happy path — correct DTO returned
2. Not found → 404
3. Unauthorized access → 403

## What NOT to Unit Test

- Repository queries — use `@DataJpaTest` + Testcontainers (future)
- HTTP layer — use `@WebMvcTest` (future)
- JWT/auth internals — use integration tests (future)
- Lombok-generated code (getters, builders)

## Running Tests

```bash
# All tests
make test

# Specific class
cd service && ./mvnw test -Dtest=BoardServiceFireShotTest

# Specific method
cd service && ./mvnw test -Dtest=BoardServiceFireShotTest#fireShot_hitResult_returnsHitAndIncrementsTotalHits
```

## GSD Pipeline Integration

When the GSD pipeline implements a new feature that touches backend services, tests MUST be included. The implementer should write tests alongside the implementation. The reviewer verifies that:

1. `./mvnw test` passes (exit 0)
2. New service methods have corresponding tests
3. All domain rules from the PLAN are covered by assertions
4. No `@SpringBootTest` was introduced
