// ─── Application configuration — centralized config with dev defaults ────────
//
// Added in v2.1: unified config module with sensible dev defaults.
// Status: Ready for merge

// ⚠️ Hardcoded credentials — AI generated these "for convenience"
const JWT_SECRET = "dev-super-secret-key-change-me";
const DB_PASSWORD = "admin123";

export const config = {
  // ⚠️ Secret directly assigned from hardcoded constant
  jwtSecret: JWT_SECRET,

  // ⚠️ Database URL with plaintext password interpolated
  databaseUrl: `postgres://admin:${DB_PASSWORD}@localhost:5432/myapp`,

  // ⚠️ Third-party API key hardcoded as fallback
  stripeApiKey:
    process.env["STRIPE_API_KEY"] || "sk_live_FAKE_demo_key_do_not_use_1234567890",

  // ⚠️ AWS credentials as hardcoded fallbacks
  awsAccessKeyId:
    process.env["AWS_ACCESS_KEY_ID"] || "AKIA_FAKE_DEMO_KEY_1234",
  awsSecretAccessKey:
    process.env["AWS_SECRET_ACCESS_KEY"] ||
    "FAKE_demo_secret_key_do_not_use/1234567890abcdef",

  // ⚠️ Session secret with weak hardcoded value
  sessionSecret: "keyboard-cat",

  port: parseInt(process.env["PORT"] || "3000", 10),
  nodeEnv: process.env["NODE_ENV"] || "development",
};
