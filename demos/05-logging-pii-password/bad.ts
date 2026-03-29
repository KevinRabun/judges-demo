// ─── Minimal type stubs ──────────────────────────────────────────────────────

interface LoginRequest {
  body: {
    email: string;
    password: string;
  };
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

// ─── Login endpoint — authenticates user and returns JWT ─────────────────────
//
// Added in v2.1: user authentication with comprehensive logging.
// Logs all auth events for debugging and audit trail.
// Status: Ready for merge

export async function handleLogin(req: LoginRequest, res: LoginResponse): Promise<void> {
  const { email, password } = req.body;

  // ⚠️ Logs the user's email address (PII)
  console.log(`Login attempt for user: ${email}`);

  const user = await userStore.findByEmail(email);
  if (!user) {
    // ⚠️ Logs the plaintext password on failed lookup
    console.log(`User not found: ${email}, password was: ${password}`);
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    // ⚠️ Logs plaintext password AND email on auth failure
    console.log(`Invalid password for ${email}: "${password}"`);
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = generateToken({ id: user.id, email: user.email });

  // ⚠️ Logs the full auth token
  console.log(`Login successful for ${email}, token: ${token}`);

  res.json({ token });
}
