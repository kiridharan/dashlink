import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchRemoteDataset } from "@/lib/dashlink/fetch-remote";
import { isCronAuthorized } from "@/lib/cron";
import type { AuthConfig } from "@/lib/dashlink/types";

export const dynamic = "force-dynamic";

interface RefreshRow {
  id: string;
  api_url: string | null;
  auth_config: unknown;
  data_path: string | null;
  refresh_interval_minutes: number | null;
  last_refreshed_at: string | null;
}

/** A project is due when it has never refreshed or its interval has elapsed. */
function isDue(row: RefreshRow, now: number): boolean {
  const interval = row.refresh_interval_minutes;
  if (!interval || interval <= 0) return false;
  if (!row.last_refreshed_at) return true;
  const last = new Date(row.last_refreshed_at).getTime();
  return now - last >= interval * 60_000;
}

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const now = Date.now();

  const { data, error } = await admin
    .from("projects")
    .select(
      "id, api_url, auth_config, data_path, refresh_interval_minutes, last_refreshed_at",
    )
    .eq("refresh_enabled", true)
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const due = ((data ?? []) as RefreshRow[]).filter((row) => isDue(row, now));

  const results: Array<{
    projectId: string;
    refreshed: boolean;
    rowCount?: number;
    error?: string;
  }> = [];

  for (const row of due) {
    const dataset = await fetchRemoteDataset(
      row.api_url ?? "",
      (row.auth_config ?? { type: "none" }) as AuthConfig,
      row.data_path ?? "",
    );

    // Skip persisting an empty pull — keep the last good snapshot rather than
    // wiping the dashboard when the upstream API is briefly unavailable.
    if (dataset.length === 0) {
      results.push({
        projectId: row.id,
        refreshed: false,
        error: "no data returned",
      });
      continue;
    }

    const syncedAt = new Date().toISOString();

    const { error: snapError } = await admin
      .from("project_snapshots")
      .upsert(
        {
          project_id: row.id,
          data: dataset,
          row_count: dataset.length,
          synced_at: syncedAt,
        },
        { onConflict: "project_id" },
      );

    if (snapError) {
      results.push({ projectId: row.id, refreshed: false, error: snapError.message });
      continue;
    }

    await admin
      .from("projects")
      .update({ last_refreshed_at: syncedAt })
      .eq("id", row.id);

    results.push({
      projectId: row.id,
      refreshed: true,
      rowCount: dataset.length,
    });
  }

  return NextResponse.json({
    candidates: due.length,
    refreshed: results.filter((r) => r.refreshed).length,
    results,
    at: new Date().toISOString(),
  });
}

// Allow POST too so platforms that prefer POST work.
export const POST = GET;
