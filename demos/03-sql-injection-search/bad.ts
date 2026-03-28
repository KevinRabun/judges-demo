// ─── Minimal type stubs ──────────────────────────────────────────────────────

interface DbPool {
  query(text: string): Promise<{ rows: Record<string, unknown>[] }>;
}

declare const pool: DbPool;

interface SearchRequest {
  query: { q?: string };
}

interface SearchResponse {
  json(body: unknown): void;
  status(code: number): SearchResponse;
}

// ─── BAD: SQL injection via string concatenation ─────────────────────────────
//
// This search endpoint builds the SQL query by interpolating the user's
// search term directly into the query string. TypeScript compiles it fine.
// ESLint sees no issues. The SQL "works" in testing.
//
// An attacker can send: ?q=' OR 1=1; DROP TABLE users; --
// and execute arbitrary SQL on the database.

export async function handleSearch(req: SearchRequest, res: SearchResponse): Promise<void> {
  const searchTerm = req.query.q;

  if (!searchTerm) {
    res.status(400).json({ error: "Missing search query" });
    return;
  }

  // ⚠️ DANGEROUS: User input interpolated directly into SQL
  const sql = `SELECT id, name, email FROM users WHERE name LIKE '%${searchTerm}%'`;

  const result = await pool.query(sql);
  res.json({ users: result.rows });
}
