# Core-API Maintenance Context

## Development Commands

| Command | Description |
|---------|-------------|
| `make up` | Start local Postgres (Docker, port 5432) |
| `make down` | Stop local Postgres |
| `make ps` | Show running containers |
| `make service-install` | Clean install (skip tests) |
| `make service-run` | Start app (dev profile, port 8081) |
| `make service-build` | Compile only |
| `make service-test` | Full test suite with pretty output |
| `make client-run` | Start frontend (dev, port 3000) |
| `make status` | Show containers + git branch |

## Profiles

| Profile | Usage | Database |
|---------|-------|----------|
| `dev` | Local development (`make service-run`) | Local Docker Postgres |
| `prod` | Production deployment | Remote Postgres (env vars) |

## Database

### Local Dev
- Start: `make up` → PostgreSQL 16 on port 5432 (user: `lastisland`, pass: from `.env.dev`, db: `lastisland_dev`)
- Stop: `make down`
- Shell: `make db-shell`

### Migrations
- Location: `src/main/resources/db/migration/`
- Naming: `V{N}__{description}.sql`
- Applied automatically by Flyway on startup (both dev and prod)
- JPA configured as `ddl-auto=validate` — schema is migration-only

### Schema Changes Workflow
1. Write migration SQL in `db/migration/V{N}__description.sql`
2. Update entities/DTOs in Java code
3. Run `make service-test` to verify
4. Flyway auto-applies on next startup

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_HOST` | Yes | Postgres host (default: localhost) |
| `DB_PORT` | Yes | Postgres port (default: 5432) |
| `DB_NAME` | Yes | Database name |
| `DB_USER` | Yes | Database user |
| `DB_PASSWORD` | Yes | Database password |
| `JWT_SECRET` | Prod only | HS256 signing secret (min 256 bits) |
| `CORS_ALLOWED_ORIGINS` | Prod only | Comma-separated allowed origins |
| `PORT` | Prod only | Server port override (default: 8081) |

## Adding a New Domain Entity

1. Create package under `domain/{name}/` with: `entity/`, `repository/`, `service/`, `controller/`, `dto/`, `mapper/`, `enums/` (as needed)
2. Entity extends `BaseEntity` (has id, createdAt, updatedAt)
3. Add Flyway migration for the new table
4. Add endpoint rules to `SecurityConfig.java` if non-standard access (default: authenticated)
5. Write unit tests with `@ExtendWith(MockitoExtension.class)`
6. Run `make service-test`

## Troubleshooting

- **Flyway checksum mismatch**: Never modify an applied migration. Create a new `V{N+1}` migration instead.
- **JWT validation fails locally**: Dev profile uses `app.jwt.secret` from `.env.dev` — ensure it's at least 256 bits.
- **Port conflict on 8081**: Check if another service is running, or override with `server.port`.
- **SSE timeout**: Default async timeout is 5 minutes (`spring.mvc.async.request-timeout=300000`). Client should reconnect with `Last-Event-ID`.
- **CORS errors**: Verify `app.cors.allowed-origins` in properties matches the frontend URL.
