// ─── Application configuration — fail-fast env loader ────────────────────────
//
// Added in v2.1: unified config module. All secrets are required.
// App crashes at boot if any required env var is missing.
// Status: Security review passed

/**
 * Require an environment variable or throw immediately at startup.
 * Never fall back to a hardcoded secret.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `See .env.example for the full list.`
    );
  }
  return value;
}

/**
 * Optional env var with a safe (non-secret) default.
 */
function optionalEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const config = {
  // ✅ All secrets are required — app crashes at boot if any are missing
  jwtSecret: requireEnv("JWT_SECRET"),
  databaseUrl: requireEnv("DATABASE_URL"),
  stripeApiKey: requireEnv("STRIPE_API_KEY"),
  awsAccessKeyId: requireEnv("AWS_ACCESS_KEY_ID"),
  awsSecretAccessKey: requireEnv("AWS_SECRET_ACCESS_KEY"),
  sessionSecret: requireEnv("SESSION_SECRET"),

  // ✅ Non-secret config can have safe defaults
  port: parseInt(optionalEnv("PORT", "3000"), 10),
  nodeEnv: optionalEnv("NODE_ENV", "development"),
};
