const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const PHONE_RE = /\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;

export function maskPII(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const str = JSON.stringify(payload);
  const masked = str
    .replace(EMAIL_RE, (m) => `${m[0]}***@${m.split("@")[1]}`)
    .replace(PHONE_RE, (m) => `${m.slice(0, 3)}****${m.slice(-2)}`);
  return JSON.parse(masked) as Record<string, unknown>;
}
