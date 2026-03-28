# Judges Caught This

> A demo hub for [**Judges Panel**](https://github.com/KevinRabun/judges) — showing AI-generated code that looks plausible, passes lint and typecheck, but contains critical issues that Judges flags.

Each scenario includes:
- **`bad.ts`** — an intentionally vulnerable implementation (the kind AI assistants generate)
- **`fixed.ts`** — the corrected version with secure best practices
- **`README.md`** — what went wrong, why linters miss it, what Judges catches, and how to fix it

---

## Demos

| # | Scenario | Key Issue | Severity |
|---|----------|-----------|----------|
| [01](demos/01-auth-middleware-jwt-decode/) | Auth Middleware — JWT decode vs verify | `jwt.decode()` trusts unsigned tokens | Critical |
| [02](demos/02-config-hardcoded-secrets/) | Config Loader — Hardcoded Secrets | Secret fallbacks reach production if env is unset | Critical |
| [03](demos/03-sql-injection-search/) | Search Endpoint — SQL Injection | User input interpolated into SQL string | Critical |
| [04](demos/04-cloud-cost-lambda-serial-io/) | Cloud Function — Cost Amplification | Unbounded loops with serial I/O in pay-per-use compute | High |
| [05](demos/05-logging-pii-password/) | Login Handler — PII in Logs | Passwords, emails, and tokens written to logs | Critical |

---

## Run Judges Locally

```bash
# Install dependencies
npm install

# Verify everything compiles
npm run build

# Scan a specific bad file
npx @kevinrabun/judges-cli eval --file demos/01-auth-middleware-jwt-decode/bad.ts

# Scan a fixed file (should produce no critical/high findings)
npx @kevinrabun/judges-cli eval --file demos/01-auth-middleware-jwt-decode/fixed.ts

# Scan all bad files with markdown output
npx @kevinrabun/judges-cli eval --file "demos/**/bad.ts" --format markdown

# Scan all demo files
npx @kevinrabun/judges-cli eval --file "demos/**/*.ts" --format markdown
```

---

## CI Setup

This repo includes a [GitHub Actions workflow](.github/workflows/judges.yml) that:

1. **Checks out** the code
2. **Installs dependencies** and runs `tsc` to verify compilation
3. **Runs Judges** via the [`KevinRabun/judges@main`](https://github.com/KevinRabun/judges) GitHub Action against the `demos/` folder
4. **Fails CI** if any critical or high findings are detected (`fail-on-findings: true`)
5. **Uploads SARIF** to GitHub Code Scanning for in-line annotations
6. **Uploads a markdown report** as a build artifact

### Demonstrating CI Pass / Fail

To see Judges in action in CI:

1. **Create a PR that touches `bad.ts` files** → CI will **fail** (critical/high findings detected)
2. **Create a PR that only modifies `fixed.ts` files** → CI will **pass** (no critical/high findings)

---

## Repo Structure

```
judges-demo/
├── .github/workflows/judges.yml   # CI workflow using Judges GitHub Action
├── demos/
│   ├── 01-auth-middleware-jwt-decode/
│   │   ├── bad.ts                  # jwt.decode() — no signature verification
│   │   ├── fixed.ts                # jwt.verify() with full validation
│   │   └── README.md
│   ├── 02-config-hardcoded-secrets/
│   │   ├── bad.ts                  # process.env.X || "hardcoded-secret"
│   │   ├── fixed.ts                # requireEnv() — fail fast
│   │   ├── .env.example
│   │   └── README.md
│   ├── 03-sql-injection-search/
│   │   ├── bad.ts                  # string interpolation in SQL
│   │   ├── fixed.ts                # parameterized query with $1
│   │   └── README.md
│   ├── 04-cloud-cost-lambda-serial-io/
│   │   ├── bad.ts                  # unbounded S3 listing, serial getObject
│   │   ├── fixed.ts                # paginated, bounded, concurrent
│   │   └── README.md
│   └── 05-logging-pii-password/
│       ├── bad.ts                  # console.log(email, password, token)
│       ├── fixed.ts                # redacted structured logging
│       └── README.md
├── package.json
├── tsconfig.json
└── README.md                       # ← you are here
```

---

## License

MIT
