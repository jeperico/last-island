# Core-API Stack Context

## Core

| Layer | Technology | Version |
|-------|-----------|---------|
| Language | Java | 21 |
| Framework | Spring Boot | 3.5.14 |
| Build | Maven | via `mvnw` wrapper |
| Database | PostgreSQL (prod) / H2 (dev/test) | 16 / embedded |
| ORM | Spring Data JPA + Hibernate | managed by Spring Boot |
| Migrations | Flyway | managed by Spring Boot |
| Security | Spring Security 6.x | stateless, RBAC |
| Auth Provider | Supabase | JWT (ES256, JWK Set URI) |
| API Docs | SpringDoc OpenAPI | 2.8.6 |
| HTTP Client | Spring RestClient | for Asaas API calls |
| Payment | Asaas (Checkout + Transfer API) | hosted payment page |

## Libraries

| Library | Purpose |
|---------|---------|
| Lombok | Boilerplate reduction (@Data, @Builder, @RequiredArgsConstructor) |
| jjwt (0.12.6) | JWT parsing/validation |
| spring-boot-starter-oauth2-resource-server | JWK Set URI resolution |
| spring-boot-starter-validation | Jakarta Bean Validation |
| spring-boot-devtools | Hot reload in dev |

## Code Quality

| Tool | Version | Purpose |
|------|---------|---------|
| Spotless | 2.44.3 | Auto-format (Palantir Java Format 2.50.0) |
| Checkstyle | 10.21.4 | Style rules |
| SpotBugs | 4.9.3.0 | Bug detection |
| JaCoCo | 0.8.12 | Code coverage |

## Testing

| Tool | Purpose |
|------|---------|
| JUnit 5 | Test framework |
| MockMvc | Integration test HTTP layer |
| H2 (MODE=PostgreSQL) | In-memory test DB |
| Flyway | Test schema setup |
| @MockitoBean | Mock external services (Asaas clients) |
| MockRestServiceServer | Unit test HTTP clients |
| spring-security-test | Security context mocking |

## Infrastructure

| Component | Technology |
|-----------|-----------|
| Container (local) | Docker Compose (PostgreSQL 16) |
| Auth / User mgmt | Supabase (external) |
| Payment gateway | Asaas (external) |
| Deployment | Planned (Step 6) |
| Monitoring | Planned (Step 7) |

## Project Conventions

- Package structure: `com.hestia.api.{layer}.{domain}`
- Layers: `common`, `domain`, `guest`, `infrastructure`
- Each domain: `controller/`, `service/`, `repository/`, `entity/`, `dto/`, `mapper/`, `enums/`
- Controllers are thin — delegate to services
- Services contain business logic
- Repositories extend `JpaRepository`
- Entities extend `BaseModel` or `BaseTenantModel`
- DTOs are Java records
- JSON naming: snake_case
- Java naming: camelCase (fields), PascalCase (classes)
