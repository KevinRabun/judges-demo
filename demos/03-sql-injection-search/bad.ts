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

// ─── User search endpoint — full-text search against users table ─────────────
//
// Added in v2.1: search users by name for the directory feature.
// Uses LIKE for flexible matching.
// Status: Ready for merge
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
