# How I Used AI to Build This Project

## The Tool

I used Claude Code (Anthropic's CLI agent) throughout the project. It runs inside the terminal and has access to read and write files, run shell commands, and execute tests. I gave it instructions, it made changes, I reviewed them. Most of the session was a back-and-forth where I directed what to build next and the agent implemented it.

---

## Planning Phase

Before writing any code, I shared the assessment PDF with the agent and asked it to help me think through the architecture.

The main decisions we worked through together:

**What data to store.** The assessment said "salary, country, job title, full name, and any other meaningful data." I decided to add department, email, and hire date because an HR tool without these fields is not realistic. The agent suggested UUID for the primary key over serial integers — I agreed because enumerable IDs are a security smell in any user-facing API.

**How to structure the backend.** The agent proposed a three-layer pattern: Repository (raw SQL), Service (business rules), Route (HTTP adapter). I chose this because it makes each layer independently testable — you can mock the repository to test the service, and mock the service to test the router. This became important later when writing unit tests.

**Which database.** The assessment mentioned SQLite as an example but I chose PostgreSQL. The reason was practical: 10,000 employees with aggregation queries (avg/min/max grouped by country and department) benefit from real indexes. PostgreSQL's `GIN` index for full-text search on names was also a factor.

**What indexes to create.** We discussed which queries would be slow at 10k rows without indexes. The insights queries group by country and job title, so a composite index on `(country, job_title)` avoids a full table scan. Full-text search on names uses a GIN index on `to_tsvector('english', full_name)`.

The agent produced `design.md` and the DB schema (`employees.sql`) from this planning session.

---

## Development Approach

I told the agent I wanted to follow TDD strictly: write failing tests first, then make them pass, then refactor. The agent was aware of this constraint throughout and flagged when I was about to skip a phase.

### RED Phase (Repository and Service)

The agent wrote failing unit tests for `EmployeeRepository` and `EmployeeService` before either existed. These tests covered:

- `findAll` with and without filters (country, department, search)
- pagination (page, pageSize, totalPages)
- `create` with duplicate email detection
- `update` with partial fields
- `delete` returning false for a non-existent ID

The tests failed immediately because the source files did not exist. That was the point.

One thing the agent caught during this phase: a `jest.config.ts` file had a key `setupFilesAfterFramework` which is not a valid Jest option. It had been left in from an earlier draft. The agent removed it.

### GREEN Phase (Repository and Service)

The agent then wrote the minimal implementation to pass those tests. A few specific decisions came out of this:

- The `mapRow` function converts PostgreSQL's snake_case column names to camelCase TypeScript fields. It also parses the `salary` column, which PostgreSQL returns as a string for `NUMERIC` types, into a JavaScript `float`.
- The `findAll` method builds a dynamic WHERE clause by accumulating `conditions[]` and `params[]` arrays. This pattern repeats later in the insights repository.
- `employee.service.ts` throws typed errors (`NotFoundError`, `ConflictError`, `ValidationError`) defined in `errors.ts`. The router then maps these to HTTP status codes. This keeps HTTP concerns out of the service layer.

I asked the agent to run the tests after each file was created. All 19 repository tests and 9 service tests passed.

### RED Phase (Router and Insights)

Before implementing the routes or the insights API, the agent wrote failing tests for both. The router tests use `supertest` to make real HTTP requests against an Express app with the service mocked. This tests the HTTP layer in isolation — status codes, response shapes, validation rules.

The insights router tests followed the same pattern.

### GREEN Phase (Router and Insights)

The agent implemented:

- `employee.router.ts`: Express routes with `express-validator` for input validation. POST requires all fields; PATCH allows partial updates. A `validate` middleware runs after the validation rules and short-circuits with a 400 if any rule fails.
- `insights.repository.ts`: Four SQL aggregation queries. The salary distribution query uses a CTE to classify each row into a bucket (`< 30k`, `30k-60k`, etc.) and counts how many rows fall in each bucket. Boundary values are strict `<` comparisons, so exactly $60,000 falls into `60k-100k`, not `30k-60k`.
- `insights.service.ts` and `insights.router.ts`: thin wrappers over the repository.

One bug appeared at this point: the insights routes were returning no response when called from the browser. The cause was that async Express handlers that throw an error need to pass the error to `next()`, otherwise Express swallows it silently. The agent fixed this by wrapping all async handlers in a small `asyncRoute` utility.

### Seed Script

The assessment said the seed script is run regularly by engineers and performance matters. I asked the agent what options existed.

The agent explained that individual `INSERT` statements for 10,000 rows are slow because each one is a separate round-trip to the database. PostgreSQL's `COPY` command streams all rows in a single operation. The agent also noted that maintaining indexes during a bulk insert is expensive — it is cheaper to drop secondary indexes before the load and rebuild them once afterward.

The final script runs in three phases:
1. Truncate the table and drop all secondary indexes.
2. Stream 10,000 rows into the table using `pg-copy-streams`, batched into 500-row buffers, with `synchronous_commit = off` to skip WAL fsyncs.
3. Rebuild all indexes in a single pass over the complete table.

Name generation uses a Fisher-Yates shuffle over the full cross-product of `first_names.txt` and `last_names.txt`. This guarantees unique emails without any retry logic — each `first × last` combination is visited at most once.

### Frontend

I asked the agent to build a Next.js frontend after the backend was working. I specified two pages: an employee table with CRUD operations and an insights dashboard.

The agent used Tailwind CSS for styling and Recharts for the charts. The employee table has filters (country, department, name search), pagination, an add/edit modal with form validation, and a delete confirmation dialog. The insights dashboard shows aggregated data as a bar chart (avg salary by country), a horizontal bar chart (by department), and a distribution table.

The agent ran into a few TypeScript errors in the Recharts components related to callback parameter types. It resolved these by narrowing the types at the call site rather than using type assertions.

### Integration Tests

After the frontend was working, I asked for integration tests that hit a real test database (PostgreSQL on port 5433 in a separate Docker container). The agent wrote two test files:

`employees.test.ts` — seeds 15 fixtures, then tests create, read, update, delete, pagination, filtering, and search.

`insights.test.ts` — seeds 5 deterministic fixtures with known salary values, then asserts exact avg/min/max numbers. For example: 3 India employees with salaries of $60k, $80k, $120k should produce avg=$86,666.67. The test uses `toBeCloseTo` for the average because of floating-point precision.

One assertion in `insights.test.ts` was initially wrong: the test expected exactly $150,000 to fall in the `100k-150k` bucket, but the SQL uses strict `<` so $150,000 actually falls in the `150k+` bucket. The agent caught this discrepancy and corrected the test.

### Refactor Phase

The last development phase was refactoring without changing any behavior. All 66 tests stayed green throughout.

The agent identified four patterns worth cleaning up:

1. Both routers were independently parsing `req.query` fields with the same casts (`req.query.country as string | undefined`). Extracted to `src/utils/parseFilters.ts`.

2. The `asyncRoute` wrapper was defined locally in `insights.router.ts` and the employee router was using inline try-catch. Extracted to `src/utils/asyncRoute.ts`, used in both routers.

3. The global error handler in `server.ts` mapped `NotFoundError` to 404 and `ConflictError` to 409. This logic was duplicated in the employee router. Extracted to `src/utils/errorMiddleware.ts`, used in both `server.ts` and in the test app setup.

4. Four methods in `InsightsRepository` each built a `conditions[]` + `params[]` array for the WHERE clause. The pattern was identical. Extracted to `src/db/queryHelpers.ts` as `buildWhere(entries)`. Also applied to `EmployeeRepository.findAll`.

---

## What the Agent Did vs What I Decided

The agent wrote all the code. I made the architectural decisions and directed the sequence of work.

Specific things I decided:
- PostgreSQL over SQLite
- Repository pattern (the agent proposed it, I confirmed it was the right call for testability)
- TDD sequence — the agent would have skipped straight to implementation if I had not specified this
- COPY-based seeding (I asked about performance options, the agent explained the tradeoffs, I chose COPY)
- Integration tests against a real DB rather than just mocking — I pushed for this because mocked tests had caused a missed production bug in a previous project I worked on

Specific things the agent caught that I would have missed:
- The invalid `setupFilesAfterFramework` key in `jest.config.ts`
- The async error handling gap in Express routes (silent swallowing)
- The off-by-one in the distribution bucket test ($150k boundary)
- The `pg` library returning `NUMERIC` columns as strings, not numbers

---

## Commit History

The commit history was reorganized at the end to reflect the actual development sequence. The final sequence:

1. Project setup — monorepo, TypeScript, Jest, DB schema
2. RED — failing unit tests for repository and service
3. GREEN — repository and service implementation
4. RED — failing unit tests for router and insights layer
5. GREEN — employee router implementation
6. GREEN — insights API implementation
7. Seed script with COPY-based bulk loading
8. Integration tests
9. Refactor — shared utilities, unified error handling, buildWhere helper

This matches the actual order of development.
