# Demo 04 — Cloud Function that Burns Money (Serial IO)

## What Copilot / AI typically generates

AI assistants produce Lambda/Cloud Function handlers that "work correctly"
but have no operational guardrails:

```ts
const allObjects = [];
do {
  const response = await s3.listObjectsV2({ Bucket: bucket }).promise();
  allObjects.push(...response.Contents);
  continuationToken = response.NextContinuationToken;
} while (continuationToken);

for (const obj of allObjects) {
  await s3.getObject({ Bucket: bucket, Key: obj.Key }).promise();
}
```

## Why this is dangerous

This code is a **cost amplification bomb**:

| Problem | Impact |
|---------|--------|
| **Unbounded listing** | Enumerates millions of objects, consuming memory and API calls |
| **Sequential processing** | One `getObject` at a time — O(n) round trips with network latency |
| **No timeout guard** | Runs until Lambda's 15-min hard limit, gets killed, restarts |
| **No pagination cap** | The `do/while` loop continues until every object is listed |
| **No error handling** | One failure aborts the entire batch; partial work is lost |
| **No concurrency control** | Either 1 at a time (slow) or unbounded `Promise.all` (throttled/crashed) |

A bucket with 1M objects can trigger tens of thousands of Lambda invocations,
rack up massive S3 GET costs, and still never finish.

## What linters miss

- TypeScript: all types are correct; async/await is properly used.
- ESLint: no unused variables, no syntax problems.
- The `do/while` loop is syntactically valid and commonly used for pagination.
- There is no lint rule for "this loop may cost you $10,000."

## What Judges flags

| Finding | Severity |
|---------|----------|
| Unbounded loop with no iteration limit or timeout guard | **High** |
| Sequential I/O in cloud function — cost amplification risk | High |
| Missing error handling in batch processing loop | Medium |
| No concurrency control for parallel API calls | Medium |

Judges detects cloud function anti-patterns: unbounded loops inside
pay-per-use compute, serial I/O where parallel would be appropriate,
and missing operational safeguards.

## How to fix

1. **Bound the pagination** — set a `maxObjects` cap
2. **Check remaining time** — use `context.getRemainingTimeInMillis()` and stop early
3. **Process in batches with bounded concurrency** — e.g., 10 at a time with `Promise.allSettled`
4. **Handle individual errors** — don't let one failure kill the batch
5. **Log structured metrics** — track pages listed, objects processed, failures

See [`fixed.ts`](./fixed.ts) for the corrected implementation.

## Run Judges locally

```bash
# Layer 1 (deterministic pattern matching)
npx @kevinrabun/judges-cli eval --file demos/04-cloud-cost-lambda-serial-io/bad.ts
npx @kevinrabun/judges-cli eval --file demos/04-cloud-cost-lambda-serial-io/fixed.ts
```

### Layer 2 — LLM Judges via MCP

This demo is a strong showcase for LLM judges. Pattern matchers can detect
unbounded loops, but only the LLM can reason about the **cost implications**:
"this lambda lists millions of S3 objects sequentially, and each invocation
costs money — this is a cost amplification bomb."

1. Open this repo in VS Code (MCP config is in `.vscode/mcp.json`)
2. Open `bad.ts` and ask Copilot: _"Use judges to evaluate this file"_
