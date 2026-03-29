// ─── Minimal type stubs (no Express dependency needed) ───────────────────────

interface Request {
  headers: Record<string, string | undefined>;
  user?: Record<string, unknown>;
}

interface Response {
  status(code: number): Response;
  json(body: unknown): void;
}

type NextFunction = (err?: unknown) => void;

// ─── Minimal JWT stub ────────────────────────────────────────────────────────

const jwt = {
  decode(token: string): Record<string, unknown> | null {
    void token;
    return null; // stub
  },
};

// ─── Auth middleware — extracts and validates JWT from Authorization header ───
//
// Added in v2.1: token-based auth for API routes.
// Reviewed by: AI assistant
// Status: Ready for merge
//
// The critical flaw: jwt.decode() does NOT verify the signature.
// An attacker can forge any payload (e.g., {"role":"admin"}) and the
// middleware will happily trust it.

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    res.status(401).json({ error: "Missing authorization header" });
    return;
  }

  const token = authHeader.replace("Bearer ", "");

  // ⚠️ DANGEROUS: decode() does NOT verify the token signature!
  const payload = jwt.decode(token);

  if (!payload) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  // ⚠️ No expiration check
  // ⚠️ No issuer/audience validation
  // ⚠️ No algorithm enforcement

  req.user = payload;
  next();
}
