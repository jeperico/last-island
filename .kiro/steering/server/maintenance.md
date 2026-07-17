# Core-API Maintenance Context

## Development Commands

| Command | Description |
|---------|-------------|
| `make up` | Start local Postgres (required for dev) |
| `make down` | Stop local Postgres |
| `make ps` | Show running containers |
| `make install` | Clean install (skips tests) |
| `make run` | Start app (dev profile, port 8081) |
| `make run-homolog` | Start app (homolog profile, remote Supabase) |
| `make run-prod` | Start app (prod profile) |
| `make test` | Full suite: lint + 182 integration tests + coverage |
| `make test-no-lint` | Tests only (skips Spotless/Checkstyle/SpotBugs, faster) |
| `make lint` | Spotless format + Checkstyle + SpotBugs |

## Profiles

| Profile | Usage | Database |
|---------|-------|----------|
| `dev` | Local development (`make run`) | Local Docker Postgres |
| `homolog` | Staging with real data (`make run-homolog`) | Remote Supabase Postgres |
| `prod` | Production deployment (`make run-prod`) | Remote Postgres (env vars) |
| `test` | Test suite (`make test`) | H2 in PostgreSQL-compat mode |

## Database

### Local Dev
- Start: `make up` → PostgreSQL 16 on port 5433 (user: `hestia`, pass: `hestia123`, db: `hestia_dev`)
- Stop: `make down`

### Migrations
- **Supabase (prod)**: `src/main/resources/db/supabase/migration/` — run manually against Supabase SQL editor
- **H2 (test)**: `src/main/resources/db/h2/migration/` — auto-applied by Flyway during tests
- Production uses `spring.flyway.enabled=false` + `ddl-auto=validate` (schema managed by Supabase)

### Schema Changes Workflow
1. Write the Supabase migration SQL in `db/supabase/migration/V{N}__description.sql`
2. Write the equivalent H2-compatible migration in `db/h2/migration/V{N}__description.sql` (H2 uses custom domains for enums)
3. Run migration on Supabase SQL editor
4. Update entities/DTOs in Java code
5. Run `make test` to verify

## Code Quality Pipeline

Runs on `make lint` and `make test`:
1. **Spotless** (Palantir Java Format 2.50.0) — auto-formats code
2. **Checkstyle** (10.21.4) — naming, imports, patterns
3. **SpotBugs** (4.9.3) — potential bug detection
4. **JaCoCo** (0.8.12) — coverage report at `target/site/jacoco/index.html`

## Formatting Rules
- Palantir Java Format (spaces, not tabs; 120-char lines)
- Import order: `com.hestia`, `jakarta`, `org`, `java`, `javax`
- Remove unused imports automatically

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_URL` | Yes | JDBC connection string |
| `DB_USERNAME` | Yes | Database user |
| `DB_PASSWORD` | Yes | Database password |
| `SUPABASE_PROJECT_ID` | Prod only | Supabase project for JWT validation |
| `ASAAS_API_KEY` | Yes | Héstia's Asaas API key |
| `ASAAS_ENVIRONMENT` | Yes | `SANDBOX` or `PRODUCTION` |
| `ASAAS_WEBHOOK_TOKEN` | Yes | Webhook validation token |

## Adding a New Domain Entity

1. Create package under `domain/{name}/` with: `entity/`, `repository/`, `service/`, `controller/`, `dto/`, `mapper/`, `enums/` (if needed)
2. Entity extends `BaseTenantModel` (has id, createdAt, updatedAt, isActive, weddingId)
3. Add Supabase + H2 migrations
4. Add seed data to `V4__test_data.sql` for tests
5. Add endpoint rules to `SecurityConfig.java` if non-standard access
6. Write integration tests with `@WithMockAdmin` / `@WithMockCouple`
7. Run `make test`

## Troubleshooting

- **H2 enum errors**: H2 uses `CREATE DOMAIN` to simulate Postgres enums. Check `V1__create_base.sql`.
- **Test failures after migration**: Ensure H2 migration matches Supabase migration semantics.
- **JWT validation fails locally**: Dev profile stubs the issuer/jwk-set-uri to localhost.
- **Asaas webhook 404**: Check the token in URL matches `ASAAS_WEBHOOK_TOKEN` env var.
