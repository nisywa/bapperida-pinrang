type Attempt = { count: number; resetAt: number };

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const globalRateLimit = globalThis as unknown as {
  loginAttempts?: Map<string, Attempt>;
};

const attempts = globalRateLimit.loginAttempts ?? new Map<string, Attempt>();
if (process.env.NODE_ENV !== "production") globalRateLimit.loginAttempts = attempts;

export function checkLoginRateLimit(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    if (current) attempts.delete(key);
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (current.count < MAX_ATTEMPTS) return { allowed: true, retryAfterSeconds: 0 };
  return { allowed: false, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) };
}

export function recordLoginFailure(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  current.count += 1;
}

export function clearLoginFailures(key: string) {
  attempts.delete(key);
}

