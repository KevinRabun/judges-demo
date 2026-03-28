// ─── Minimal type stubs ──────────────────────────────────────────────────────

interface DbPool {
  query(text: string, params: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}

declare const pool: DbPool;

interface SearchRequest {
  query: { q?: string };
}

interface SearchResponse {
  json(body: unknown): void;
  status(code: number): SearchResponse;
}

// ─── User search endpoint — parameterized query with input validation ────────
//
// Added in v2.1: search users by name for the directory feature.
// Uses $1 parameterized queries to prevent SQL injection.
// Status: Security review passed

const MAX_SEARCH_LENGTH = 200;
const MAX_RESULTS = 50;

export async function handleSearch(req: SearchRequest, res: SearchResponse): Promise<void> {
  const searchTerm = req.query.q;

  if (!searchTerm) {
    res.status(400).json({ error: "Missing search query" });
    return;
  }

  // ✅ Input length validation — reject unreasonably long queries
  if (searchTerm.length > MAX_SEARCH_LENGTH) {
    res.status(400).json({ error: `Search query too long (max ${MAX_SEARCH_LENGTH} chars)` });
    return;
  }

  // ✅ Parameterized query — the database driver handles escaping
  const sql = `SELECT id, name, email FROM users WHERE name ILIKE $1 LIMIT $2`;
  const params = [`%${searchTerm}%`, MAX_RESULTS];

  const result = await pool.query(sql, params);
  res.json({ users: result.rows });
}
