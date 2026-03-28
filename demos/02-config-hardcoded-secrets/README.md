# Demo 02 — Config Loader with Hardcoded Secrets

## What Copilot / AI typically generates

AI assistants love the `process.env.X || "default"` pattern. It's convenient
for local development, but the "defaults" they choose are real-looking
credentials:

```ts
jwtSecret: process.env.JWT_SECRET || "dev-super-secret-key-change-me",
databaseUrl: process.env.DATABASE_URL || "postgres://admin:admin123@localhost:5432/myapp",
stripeApiKey: process.env.STRIPE_API_KEY || "sk_live_FAKE_demo_key_do_not_use_1234567890",
```

## Why this is dangerous

If the environment variable is accidentally unset in production (misconfigured
deploy, missing `.env`, wrong secret manager path), the app **silently falls
back to the hardcoded credential** — which is:

- **Publicly visible** in the Git history
- **Identical across every deployment** using this template
- **Known to any attacker** who reads the source code

This is **CWE-798**: Use of Hard-coded Credentials.

## What linters miss

- TypeScript type-checks fine: `string | string` → `string`.
- ESLint's `no-hardcoded-credentials` only catches a few naming patterns.
- The `||` fallback is a common, expected JS pattern — no rule flags it.
- Secret scanners may or may not catch examples vs. real keys.

## What Judges flags

| Finding | Severity |
|---------|----------|
| Hardcoded secret used as fallback — will reach production if env is unset | **Critical** |
| Database connection string contains embedded credentials | High |
| API key literal in source code | High |
| AWS credential fallback in application code | Critical |

Judges detects the **semantic pattern** of `env || "secret-looking-string"` in
config files and understands that fallback secrets are a deployment risk.

## How to fix

1. **Fail fast**: throw at startup if a required secret is missing
2. **Never provide secret defaults** — only non-secret config (port, log level) gets defaults
3. **Ship a `.env.example`** with blank values as documentation
4. **Use a secret manager** (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault) in production

See [`fixed.ts`](./fixed.ts) and [`.env.example`](./.env.example).

## Run Judges locally

```bash
# Layer 1 (deterministic pattern matching)
npx @kevinrabun/judges-cli eval --file demos/02-config-hardcoded-secrets/bad.ts
npx @kevinrabun/judges-cli eval --file demos/02-config-hardcoded-secrets/fixed.ts
```

### Layer 2 — LLM Judges via MCP

This demo particularly benefits from LLM analysis (Layer 2). The LLM understands
that `"keyboard-cat"` as a session secret and `"dev-super-secret-key-change-me"`
as a JWT secret are dangerous — even when linters and pattern matchers see only
valid string assignments.

1. Open this repo in VS Code (MCP config is in `.vscode/mcp.json`)
2. Open `bad.ts` and ask Copilot: _"Use judges to evaluate this file"_
3. The LLM reasons about the **semantic meaning** of the values, not just their syntax
