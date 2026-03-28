// ─── Minimal type stubs ──────────────────────────────────────────────────────

interface LoginRequest {
  body: {
    email: string;
    password: string;
  };
  headers: Record<string, string | undefined>;
}

interface LoginResponse {
  json(body: unknown): void;
  status(code: number): LoginResponse;
}

interface User {
  id: string;
  email: string;
  passwordHash: string;
}

interface UserStore {
  findByEmail(email: string): Promise<User | null>;
}

declare const userStore: UserStore;
declare function comparePassword(plain: string, hash: string): Promise<boolean>;
declare function generateToken(user: { id: string; email: string }): string;

// ─── FIXED: Login handler with safe, structured logging ──────────────────────

/**
 * Redact an email address for safe logging: "u***@example.com"
 */
function redactEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***@***";
  return `${local[0]}***@${domain}`;
}

/**
 * Generate a short event ID for correlation without exposing user data.
 */
function eventId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Structured log entry — never include secrets, PII, or tokens.
 */
function log(event: string, data: Record<string, unknown>): void {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), event, ...data }));
}

export async function handleLogin(req: LoginRequest, res: LoginResponse): Promise<void> {
  const { email, password } = req.body;
  const reqId = eventId();

  // ✅ Log the event, not the data — redact the email, omit the password entirely
  log("login_attempt", { reqId, email: redactEmail(email) });

  const user = await userStore.findByEmail(email);
  if (!user) {
    // ✅ No PII in the log — just the event and a correlation ID
    log("login_failed", { reqId, reason: "user_not_found" });
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    // ✅ Log the failure reason, not the password
    log("login_failed", { reqId, reason: "invalid_password", userId: user.id });
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = generateToken({ id: user.id, email: user.email });

  // ✅ Log success with user ID (not email or token)
  log("login_success", { reqId, userId: user.id });

  res.json({ token });
}
