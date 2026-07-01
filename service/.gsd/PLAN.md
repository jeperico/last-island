# Add OpenAPI/Swagger Documentation

## Objective
Integrate springdoc-openapi into Last Island so the API is fully documented via Swagger UI, accessible without authentication, with Bearer JWT support and tagged controller grouping.

## Files to touch
- **modify** `pom.xml` — add springdoc-openapi-starter-webmvc-ui dependency
- **create** `src/main/java/com/last_island/api/infrastructure/config/OpenApiConfig.java` — OpenAPI metadata, tags, security scheme, tag ordering
- **modify** `src/main/java/com/last_island/api/infrastructure/security/config/SecurityConfig.java` — permit Swagger/OpenAPI paths
- **modify** `src/main/java/com/last_island/api/domain/user/controller/AuthController.java` — add @Tag annotation
- **modify** `src/main/java/com/last_island/api/domain/game/controller/GameController.java` — add @Tag annotation
- **modify** `src/main/resources/application.properties` — add springdoc properties

## Steps

1. **Add springdoc dependency to pom.xml**
   Insert after the `spring-boot-starter-webmvc` dependency block:
   ```xml
   <dependency>
       <groupId>org.springdoc</groupId>
       <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
       <version>2.8.6</version>
   </dependency>
   ```
   Note: explicit version required since springdoc is not in the Spring Boot BOM. Follows same pattern as jjwt dependencies.

2. **Create OpenApiConfig.java** in `com.last_island.api.infrastructure.config`
   - Annotate with `@Configuration`
   - Define a `@Bean OpenAPI customOpenAPI()` returning an `OpenAPI` object with:
     - `info`: title="Last Island API", description="Multiplayer naval battle game API — One Piece themed", version="1.0.0"
     - `tags`: list with Tag("Auth"), Tag("Battles")
     - Security scheme: `addSecurityItem(new SecurityRequirement().addList("Bearer"))` and `components.addSecuritySchemes("Bearer", new SecurityScheme().type(HTTP).scheme("bearer").bearerFormat("JWT"))`
   - Define a `@Bean OpenApiCustomizer tagOrderCustomizer()` that sorts tags by name (Auth before Battles alphabetically)

3. **Update SecurityConfig.java** — permit Swagger paths
   In the `securityFilterChain` method, add to the `.requestMatchers(...)` call:
   ```java
   .requestMatchers("/auth/register", "/auth/login", "/auth/refresh",
                    "/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
   ```

4. **Add @Tag to AuthController**
   Add import `io.swagger.v3.oas.annotations.tags.Tag` and annotate class:
   ```java
   @Tag(name = "Auth")
   @RestController
   @RequestMapping("/auth")
   public class AuthController {
   ```

5. **Add @Tag to GameController**
   Add import `io.swagger.v3.oas.annotations.tags.Tag` and annotate class:
   ```java
   @Tag(name = "Battles")
   @RestController
   @RequestMapping("/games")
   public class GameController {
   ```

6. **Add springdoc properties to application.properties**
   Append:
   ```properties
   # OpenAPI / Swagger
   springdoc.api-docs.path=/v3/api-docs
   springdoc.swagger-ui.path=/swagger-ui.html
   ```

## Verification

```bash
# 1. Compile succeeds with new dependency
./mvnw compile -q && echo "COMPILE OK"

# 2. All 36 tests still pass
./mvnw test -q && echo "TESTS OK"

# 3. Verify OpenApiConfig class exists with correct content
grep -q "Last Island API" src/main/java/com/last_island/api/infrastructure/config/OpenApiConfig.java && echo "CONFIG OK"

# 4. Verify SecurityConfig permits swagger paths
grep -q "swagger-ui" src/main/java/com/last_island/api/infrastructure/security/config/SecurityConfig.java && echo "SECURITY OK"

# 5. Verify @Tag annotations on controllers
grep -q '@Tag(name = "Auth")' src/main/java/com/last_island/api/domain/user/controller/AuthController.java && echo "AUTH TAG OK"
grep -q '@Tag(name = "Battles")' src/main/java/com/last_island/api/domain/game/controller/GameController.java && echo "GAME TAG OK"

# 6. Verify application.properties has springdoc entries
grep -q "springdoc.api-docs.path" src/main/resources/application.properties && echo "PROPS OK"
```

Manual verification (post-deploy):
- Open `http://localhost:8081/api/v1/swagger-ui/index.html` — should load without auth
- Click "Authorize" button → enter a valid JWT → test GET /games endpoint
- Verify two tag groups appear: "Auth" and "Battles"

## Rollback

```bash
git checkout -- pom.xml src/main/resources/application.properties
git checkout -- src/main/java/com/last_island/api/infrastructure/security/config/SecurityConfig.java
git checkout -- src/main/java/com/last_island/api/domain/user/controller/AuthController.java
git checkout -- src/main/java/com/last_island/api/domain/game/controller/GameController.java
rm -f src/main/java/com/last_island/api/infrastructure/config/OpenApiConfig.java
```
