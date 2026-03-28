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

// ─── JWT library types (from 'jsonwebtoken' — not installed to keep deps minimal)
// Algorithm restricted to HS256 only at the type level
type AllowedAlgorithm = "HS256";

interface JwtVerifyOptions {
  algorithms: AllowedAlgorithm[];
  issuer: string;
  audience: string;
}

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace jsonwebtoken {
  function verify(token: string, secretOrPublicKey: string, options: JwtVerifyOptions): Record<string, unknown>;
}

// ✅ Allowed signing algorithms — restricted to prevent "none" algorithm attack
const ALLOWED_ALGORITHMS: AllowedAlgorithm[] = ["HS256"];

// ─── FIXED: Auth middleware using jwt.verify() with full validation ──────────

// In production, load from environment / secret manager — never hardcode.
const JWT_SECRET = process.env["JWT_SECRET"];
const JWT_ISSUER = process.env["JWT_ISSUER"] ?? "https://auth.example.com";
const JWT_AUDIENCE = process.env["JWT_AUDIENCE"] ?? "my-api";

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!JWT_SECRET) {
    // Fail closed — never silently skip auth
    res.status(500).json({ error: "Server misconfiguration" });
    return;
  }

  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or malformed authorization header" });
    return;
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    // ✅ verify() checks the cryptographic signature
    const payload = jsonwebtoken.verify(token, JWT_SECRET, {
      algorithms: ALLOWED_ALGORITHMS, // ✅ Restricted to HS256 — prevents "none" algorithm attack
      issuer: JWT_ISSUER,    // ✅ Validate issuer
      audience: JWT_AUDIENCE, // ✅ Validate audience
    });

    // ✅ exp and nbf are checked automatically by jwt.verify()
    // ✅ If the signature, expiration, or claims are invalid, verify() throws

    req.user = payload;
    next();
  } catch {
    // Don't leak internal error details to the client
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
