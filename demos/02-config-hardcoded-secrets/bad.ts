// ─── Application configuration — centralized env-based config ────────────────
//
// Added in v2.1: unified config module with sensible dev defaults.
// All values can be overridden via environment variables.
// Status: Ready for merge

export const config = {
  // ⚠️ Hardcoded JWT secret used if env var is missing
  jwtSecret: process.env["JWT_SECRET"] || "dev-super-secret-key-change-me",

  // ⚠️ Database URL with embedded admin credentials
  databaseUrl:
    process.env["DATABASE_URL"] ||
    "postgres://admin:admin123@localhost:5432/myapp",

  // ⚠️ Third-party API key hardcoded as fallback
  stripeApiKey:
    process.env["STRIPE_API_KEY"] || "sk_live_FAKE_demo_key_do_not_use_1234567890",

  // ⚠️ AWS credentials as fallback
  awsAccessKeyId:
    process.env["AWS_ACCESS_KEY_ID"] || "AKIA_FAKE_DEMO_KEY_1234",
  awsSecretAccessKey:
    process.env["AWS_SECRET_ACCESS_KEY"] ||
    "FAKE_demo_secret_key_do_not_use/1234567890abcdef",

  // ⚠️ Session secret
  sessionSecret:
    process.env["SESSION_SECRET"] || "keyboard-cat",

  port: parseInt(process.env["PORT"] || "3000", 10),
  nodeEnv: process.env["NODE_ENV"] || "development",
};
