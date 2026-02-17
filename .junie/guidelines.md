# Junie Guidelines

This document provides guidelines for developing a Spring Boot project.
It includes coding standards, Spring Boot best practices and testing recommendations to follow.

### Prerequisites
- Java 25 (toolchain)
- Gradle (use the included Gradle wrapper: `./gradlew`)
- Node.js + npm (required because the backend build runs the client build)
- Docker and Docker Compose

### Project Structure

Follow **package-by-feature/module** and in each module **package-by-layer** code organization style:

```shell
project-root/
├── build.gradle
├── settings.gradle
├── gradlew
├── client/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── de/schrell/drives/
│   │   │       ├── config/
│   │   │       ├── drives/
│   │   │       │     ├── api/
│   │   │       │     │   ├── controllers/
│   │   │       │     │   └── dtos/
│   │   │       │     ├── config/
│   │   │       │     ├── domain/
│   │   │       │     │   ├── entities/
│   │   │       │     │   ├── exceptions/
│   │   │       │     │   ├── mappers/
│   │   │       │     │   ├── models/
│   │   │       │     │   ├── repositories/
│   │   │       │     │   └── services/
│   │   │       │     ├── jobs/
│   │   │       │     ├── eventhandlers/
│   └── resources/
│   │       ├── application.yaml
│   │       └── db/migration/
│   └── test/
│   │   └── java/
│   │   │   └── de/schrell/drives/
│   │   │       ├── drives/
│   │   │       │     ├── api/
│   │   │       │     │   ├── controllers/
│   │   │       │     ├── domain/
│   │   │       │     │   └── services/
└── README.md
```

1. **Web Layer** (`de.schrell.drives.drives.api`):
    - Controllers handle HTTP requests and responses
    - DTOs for request/response data
    - Global exception handling

2. **Service Layer** (`de.schrell.drives.drives.domain.services`):
    - Business logic implementation
    - Transaction management

3. **Repository Layer** (`de.schrell.drives.drives.domain.repositories`):
    - Spring Data JPA repositories
    - Database access

4. **Entity Layer** (`de.schrell.drives.drives.domain.entities`):
    - JPA entities representing database tables

5. **Model Layer** (`de.schrell.drives.drives.domain.models`):
    - DTOs for domain objects
    - Command objects for operations

6. **Mapper Layer** (`de.schrell.drives.drives.domain.mappers`):
    - Converters from DTOs to JPA entities and vice-versa

7. **Exceptions** (`de.schrell.drives.drives.domain.exceptions`):
    - Custom exceptions

8. **Config** (`de.schrell.drives.config`):
    - Spring Boot configuration classes such as WebMvcConfig, WebSecurityConfig, etc.

### Java Code Style Guidelines

1. **Java Code Style**:
    - Use Java 25 features where appropriate (records, text blocks, pattern matching, etc.)
    - Follow standard Java naming conventions
    - Use meaningful variable and method names
    - Use `public` access modifier only when necessary
    - Rely on Lombok for boilerplate; do not hand-write getters/setters/builders Lombok already provides

2. **Testing Style**:
    - Use descriptive test method names
    - Follow the Given-When-Then pattern
    - Use AssertJ for assertions
    - Use JUnit 5 and Spring Boot test support; use Mockito only when a real dependency is not practical

### Spring Boot Code Style Guidelines
1. Dependency Injection Style
    * Don't use Spring Field Injection in production code.
    * Use Constructor Injection without adding `@Autowired`.

2. Transactional Boundaries
    * Make a business logic layer (@Service classes) as a transactional boundary.
    * Annotate methods that perform DB read-only operations with @Transactional(readOnly=true).
    * Annotate methods that perform DB write operations with @Transactional.
    * Keep transactions as short as possible.

3. Don't use JPA entities in the "web" layer
    * Instead, create dedicated Request/Response objects as Java records.
    * Use Jakarta Validation annotations on Request object.

4. Create custom Spring Data JPA methods with meaningful method names using JPQL queries instead of using long derived query method names.

5. Create usecase specific Command objects and pass them to the "service" layer methods to perform create or update operations.

6. Application Configuration:
    * Create all the application-specific configuration properties with a common prefix in `application.yaml`.
    * Use typed configuration with `@ConfigurationProperties` and `@Validated` constraints.

7. Implement Global Exception Handling:
    * `@ControllerAdvice`/`@RestControllerAdvice` with `@ExceptionHandler` methods.
    * Return consistent error payloads (e.g. a standard `ErrorResponse` DTO).

8. Logging:
    * Never use `System.out.println()` for production logging.
    * Use SLF4J logging.

9. Static Content:
    * The frontend build outputs to `src/main/resources/public`.
    * Serve static assets via Spring Boot static resources; avoid WebJars unless there is a clear need.

10. Use Lombok for concise and readable code.

### Database Schema Management
Use Flyway for database migrations:

- Migration scripts should be in `src/main/resources/db/migration`
- Naming convention: `V{version}__{description}.sql`
- Keep `ddl-auto` non-destructive for production environments; use `validate` or `none` when possible

### Test Best Practices
1. **Unit Tests**: Test individual components in isolation using mocks only when required
2. **Integration Tests**: Use Spring Boot test slices or full context tests where behavior crosses layers
3. **Use descriptive test names** that explain what the test is verifying
4. **Follow the Given-When-Then pattern** for a clear test structure
5. **Use AssertJ for assertions** for more readable assertions
6. **Prefer testing with real dependencies** where practical
7. **Coverage**: Keep minimum 90% code coverage (Jacoco enforces this in `check`)
8. **Commands**: Use `./gradlew test` and `./gradlew check` to verify tests and coverage

### Documentation
1. Keep `DOCUMENTATION.md` as the top-level entry point and add links to new docs.
2. Add or update package/class docs under `docs/` when behavior changes.
3. Use Mermaid diagrams when they clarify behavior. Always start Mermaid blocks with:
   ---
   config:
     layout: elk
   ---
