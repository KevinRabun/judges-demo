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

// ─── Auth module (wraps token verification in production) ────────────────────
//
// In a real project this would be imported from a dedicated auth module:
//   import { authenticateBearer } from "./auth";
//
// The implementation verifies the cryptographic signature, validates
// the issuer/audience/expiration claims, enforces a strict algorithm
// allowlist, and returns the authenticated payload or null on failure.

declare function authenticateBearer(bearerValue: string): Record<string, unknown> | null;

// ─── FIXED: Auth middleware using verified token authentication ──────────────

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or malformed authorization header" });
    return;
  }

  // ✅ authenticateBearer() verifies the signature and validates all claims
  // ✅ Returns null on any verification failure — fail closed
  const payload = authenticateBearer(authHeader.slice(7));

  if (!payload) {
    // Don't leak internal error details to the client
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  req.user = payload;
  next();
}
