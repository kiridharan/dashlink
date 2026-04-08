"use server";

import type { GenerateResult } from "./types";
import { DEMO_DASHBOARD_ID } from "./dummy-data";

/**
 * Generate a dashboard from a public API URL.
 *
 * Current behaviour (UI-only / pre-Supabase):
 *  1. Validate the URL format.
 *  2. Return the demo dashboard ID so the view page renders with sample data.
 *
 * Production TODO:
 *  • Fetch `apiUrl` server-side (avoids CORS).
 *  • Run `detectSchema(data, apiUrl)`.
 *  • Persist {api_url, config} to Supabase dashboards table.
 *  • Return the real Supabase row UUID.
 */
export async function generateDashboard(
  apiUrl: string,
): Promise<GenerateResult> {
  // 1. Basic URL validation — throws on malformed input
  try {
    const parsed = new URL(apiUrl);
    // Only allow http/https to avoid file://, javascript:, etc.
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { success: false, error: "Only HTTP(S) URLs are supported." };
    }
  } catch {
    return { success: false, error: "Please enter a valid URL." };
  }

  // 2. Return demo ID (Supabase persistence pending)
  return { success: true, id: DEMO_DASHBOARD_ID };
}
