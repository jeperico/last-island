# Core-API Stack Context

## Core

| Layer | Technology | Version |
|-------|-----------|---------|
| Language | Java | 21 |
| Framework | Spring Boot | 4.1 |
| Build | Maven | via `mvnw` wrapper |
| Database | PostgreSQL | 16 |
| ORM | Spring Data JPA + Hibernate | managed by Spring Boot |
| Migrations | Flyway | managed by Spring Boot |
| Security | Spring Security 6.x | stateless, JWT filter |
| Auth | Self-issued JWT (HS256) | access + refresh token pair |
| API Docs | SpringDoc OpenAPI | 2.8.6 |
| Real-Time | Server-Sent Events (SSE) | Spring MVC async |

## Libraries

| Library | Purpose |
|---------|---------|
| Lombok | Boilerplate reduction (@Data, @Builder, @RequiredArgsConstructor) |
| jjwt (0.12.6) | JWT creation, parsing, and validation |
| spring-boot-starter-security | Security filter chain, BCrypt |
| spring-boot-devtools | Hot reload in dev |

## Testing

| Tool | Purpose |
|------|---------|
| JUnit 5 | Test framework |
| Mockito | Mocking (unit tests, no Spring context) |
| AssertJ | Fluent assertions |
| @ExtendWith(MockitoExtension.class) | Fast unit tests without Spring |

## Infrastructure

| Component | Technology |
|-----------|-----------|
| Container (local) | Docker Compose (PostgreSQL 16) |
| Auth | Self-issued JWT (no external auth provider) |
| Deployment | Render (planned) |

## Project Conventions

- Package structure: `com.last_island.api.{layer}.{domain}`
- Layers: `common`, `domain`, `infrastructure`
- Domains: `user`, `game`, `board`, `lobby`, `haki`
- Each domain: `controller/`, `service/`, `repository/`, `entity/`, `dto/`, `mapper/`, `enums/`
- Controllers are thin — delegate to services
- Services contain business logic
- Repositories extend `JpaRepository`
- Entities extend `BaseEntity` (has id, createdAt, updatedAt)
- DTOs are Java records
- JSON naming: snake_case (Jackson global config)
- Java naming: camelCase (fields), PascalCase (classes)
