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

// ─── BAD: Auth middleware using jwt.decode() instead of jwt.verify() ─────────
//
// This looks correct at first glance — it extracts the token, decodes it,
// and attaches the user to the request. It passes TypeScript compilation
// and ESLint with no warnings.
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
