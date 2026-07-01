/**
 * Shared authorization for cron endpoints.
 *
 * Accepts either a `Bearer ${CRON_SECRET}` header or Vercel Cron's own
 * `x-vercel-cron: 1` header. In dev (no CRON_SECRET set) requests are allowed
 * so routes stay testable locally.
 */
export function isCronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  if (req.headers.get("authorization") === `Bearer ${secret}`) return true;
  if (req.headers.get("x-vercel-cron") === "1") return true;
  return false;
}
