# Demo 01 — Auth Middleware: `jwt.decode()` vs `jwt.verify()`

## What Copilot / AI typically generates

AI code assistants often produce JWT middleware that calls `jwt.decode()` to
extract the payload and attach it to `req.user`. The code compiles, passes
ESLint, and even "works" in development because the payload looks correct.

```ts
const payload = jwt.decode(token);   // ← looks fine, returns the payload
req.user = payload;
```

## Why this is dangerous

`jwt.decode()` **does not verify the cryptographic signature**. An attacker can
craft a token with any payload (e.g., `{"role":"admin","sub":"attacker"}`) and
the middleware will trust it unconditionally.

Additional issues in the bad version:
- **No expiration check** — expired tokens are accepted forever
- **No issuer / audience validation** — tokens from other services are accepted
- **No algorithm enforcement** — vulnerable to the `alg: "none"` attack

**CWE-345**: Insufficient Verification of Data Authenticity

## What linters miss

- TypeScript sees valid types: `jwt.decode()` returns an object, which is used correctly.
- ESLint sees no unused variables, no syntax issues.
- The logic *looks* like proper auth middleware.

Linters check **syntax and types**, not **cryptographic correctness**.

## What Judges flags

| Finding | Severity |
|---------|----------|
| JWT token decoded but not verified — signature bypass | **Critical** |
| Missing token expiration validation | High |
| No issuer/audience claim enforcement | High |

Judges understands that `jwt.decode()` in an auth path is a security
anti-pattern and flags it with high confidence.

## How to fix

1. Replace `jwt.decode()` with `jwt.verify(secret, options)`
2. Enforce an algorithm allow-list (e.g., `["HS256"]`)
3. Validate `iss`, `aud`, `exp`, and `nbf` claims
4. Fail closed — return 401 on any verification error
5. Load the signing secret from environment variables, not code

See [`fixed.ts`](./fixed.ts) for the corrected implementation.

## Run Judges locally

```bash
# Layer 1 (deterministic pattern matching)
npx @kevinrabun/judges-cli eval --file demos/01-auth-middleware-jwt-decode/bad.ts
npx @kevinrabun/judges-cli eval --file demos/01-auth-middleware-jwt-decode/fixed.ts
npx @kevinrabun/judges-cli eval --file demos/01-auth-middleware-jwt-decode/bad.ts --format markdown
```

### Layer 2 — LLM Judges via MCP

For deeper, context-aware analysis using LLM reasoning:

1. Open this repo in VS Code (MCP config is in `.vscode/mcp.json`)
2. Open `bad.ts` and ask Copilot: _"Use judges to evaluate this file"_
3. The LLM applies 45 expert judge personas to reason about the code — catching that `jwt.decode()` in an auth middleware path is a signature bypass, not just a "function call"
