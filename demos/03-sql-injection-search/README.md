# Demo 03 — SQL Injection via Search Endpoint

## What Copilot / AI typically generates

AI assistants frequently produce search handlers that build SQL queries using
template literals or string concatenation:

```ts
const sql = `SELECT id, name, email FROM users WHERE name LIKE '%${searchTerm}%'`;
const result = await pool.query(sql);
```

This is the textbook SQL injection pattern, but it compiles cleanly and works
perfectly during development with benign test inputs.

## Why this is dangerous

An attacker can inject arbitrary SQL by manipulating the search parameter:

```
GET /search?q=' OR 1=1; DROP TABLE users; --
```

This can lead to:
- **Full database exfiltration** (reading all tables)
- **Data destruction** (DROP, DELETE, TRUNCATE)
- **Privilege escalation** (modifying user roles)
- **Server compromise** via `COPY TO PROGRAM` (PostgreSQL)

**CWE-89**: Improper Neutralization of Special Elements in SQL Command

## What linters miss

- TypeScript sees `string` + `string` → valid `string` — no type error.
- ESLint has no built-in rule for SQL injection. Some plugins exist but need
  explicit setup and miss template literal patterns.
- The code follows standard async/await patterns — it looks professional.

## What Judges flags

| Finding | Severity |
|---------|----------|
| SQL query built from unsanitized user input — injection risk | **Critical** |
| No input length validation on user-supplied search parameter | Medium |
| Query returns unbounded results (no LIMIT) | Medium |

Judges recognizes the pattern of user-controlled data flowing into a SQL string
and flags it as a high-confidence injection vector.

## How to fix

1. **Use parameterized queries** — `$1`, `$2` placeholders with a params array
2. **Validate input length** — reject unreasonably long queries
3. **Cap results** — add a `LIMIT` to prevent large result sets
4. **Use an ORM or query builder** that parameterizes by default

See [`fixed.ts`](./fixed.ts) for the corrected implementation.

## Run Judges locally

```bash
# Layer 1 (deterministic pattern matching)
npx @kevinrabun/judges-cli eval --file demos/03-sql-injection-search/bad.ts
npx @kevinrabun/judges-cli eval --file demos/03-sql-injection-search/fixed.ts
```

### Layer 2 — LLM Judges via MCP

1. Open this repo in VS Code (MCP config is in `.vscode/mcp.json`)
2. Open `bad.ts` and ask Copilot: _"Use judges to evaluate this file"_
3. The LLM traces the data flow from `req.query.q` into the SQL template literal
   and identifies it as an injection vector with full contextual reasoning
