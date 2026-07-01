import type { AuthConfig, Dataset } from "./types";
import { flattenJsonToDataset } from "./flatten";

/**
 * Server-side fetch of a project's source API into a flat Dataset.
 *
 * Shared by the alert and refresh cron jobs. Runs on the Node runtime (uses
 * Buffer for Basic auth). Returns `[]` on any failure so callers can fall back
 * to the last stored snapshot rather than crashing a batch job.
 */

const FETCH_TIMEOUT_MS = 15_000;
const MAX_ROWS = 5000;

function authHeaders(authConfig: AuthConfig): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (authConfig.type === "bearer" && authConfig.token) {
    headers["Authorization"] = `Bearer ${authConfig.token}`;
  } else if (authConfig.type === "apikey" && authConfig.token) {
    headers[authConfig.headerName?.trim() || "X-API-Key"] = authConfig.token;
  } else if (
    authConfig.type === "basic" &&
    authConfig.username &&
    authConfig.password
  ) {
    headers["Authorization"] =
      "Basic " +
      Buffer.from(`${authConfig.username}:${authConfig.password}`).toString(
        "base64",
      );
  }
  return headers;
}

/** Drill into a JSON payload by dot-notation path (e.g. "data.results"). */
function resolveDataPath(json: unknown, dataPath?: string): unknown {
  const path = dataPath?.trim();
  if (!path) return json;
  let current: unknown = json;
  for (const segment of path.split(".")) {
    if (current && typeof current === "object") {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }
  return current;
}

export async function fetchRemoteDataset(
  apiUrl: string,
  authConfig: AuthConfig,
  dataPath?: string,
): Promise<Dataset> {
  if (!apiUrl || !apiUrl.startsWith("http")) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(apiUrl, {
      headers: authHeaders(authConfig),
      signal: controller.signal,
    });
    if (!res.ok) return [];
    const json = await res.json();
    const scoped = resolveDataPath(json, dataPath);
    return flattenJsonToDataset(scoped ?? json).slice(0, MAX_ROWS);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
