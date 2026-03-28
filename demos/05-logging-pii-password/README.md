# Demo 05 — Logging PII and Passwords

## What Copilot / AI typically generates

AI assistants add `console.log` statements that include user-supplied data
for "debugging convenience":

```ts
console.log(`Login attempt for user: ${email}`);
console.log(`Invalid password for ${email}: "${password}"`);
console.log(`Login successful for ${email}, token: ${token}`);
```

This code is functionally correct and passes every linter.

## Why this is dangerous

Those log lines end up in **production logging infrastructure** (CloudWatch,
Datadog, Splunk, ELK) where they are:

- **Visible to operations staff** and anyone with log access
- **Stored for months or years** in log retention policies
- **Indexed and searchable** — an insider threat can trivially search for passwords
- **Shipped to third-party services** that may not meet compliance requirements

Specific violations:
- **Plaintext passwords in logs** — if the log store is breached, every logged password is exposed
- **Email addresses (PII)** — violates GDPR Art. 5(1)(c) data minimization
- **Auth tokens in logs** — token theft via log access (CWE-532)

**CWE-532**: Insertion of Sensitive Information into Log File

## What linters miss

- TypeScript: template literals with string variables — perfectly valid.
- ESLint: `console.log` is allowed by default; no rule inspects the content.
- Even `no-console` only warns about console usage in general — not about what's logged.

## What Judges flags

| Finding | Severity |
|---------|----------|
| Plaintext password logged to console | **Critical** |
| Auth token written to application logs | **Critical** |
| PII (email address) in log output | High |
| Unstructured logging without redaction | Medium |

Judges detects sensitive data flowing into logging functions by tracing
variable origins (request body fields named `password`, `email`, `token`)
to sink functions (`console.log`, `logger.info`, etc.).

## How to fix

1. **Never log passwords or tokens** — not even partially
2. **Redact PII** — mask emails: `u***@example.com`
3. **Use structured logging** — JSON format with event names, not freeform strings
4. **Log correlation IDs** — use a request ID to trace events without PII
5. **Log user IDs (not emails)** — internal identifiers are not PII

See [`fixed.ts`](./fixed.ts) for the corrected implementation.

## Run Judges locally

```bash
# Layer 1 (deterministic pattern matching)
npx @kevinrabun/judges-cli eval --file demos/05-logging-pii-password/bad.ts
npx @kevinrabun/judges-cli eval --file demos/05-logging-pii-password/fixed.ts
```

### Layer 2 — LLM Judges via MCP

1. Open this repo in VS Code (MCP config is in `.vscode/mcp.json`)
2. Open `bad.ts` and ask Copilot: _"Use judges to evaluate this file"_
3. The LLM identifies that variables named `password` and `email` flowing into
   `console.log` is a PII leak — understanding the **semantic meaning** of the
   data, not just the function call pattern
