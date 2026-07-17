import type { SupabaseClient } from "@supabase/supabase-js";

export const AI_DASHBOARD_FLAG = "ai_dashboard";

/**
 * DB-backed per-user feature flag for the AI dashboard generator.
 *
 * A user has access only if they have an enabled 'ai_dashboard' row in
 * public.feature_flags (managed by operators via SQL/service role; RLS lets
 * users read only their own rows). Everyone else gets a 403 at the API layer
 * and never sees the panel in the builder.
 */
export async function isAiDashboardEnabled(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("feature_flags")
    .select("enabled")
    .eq("user_id", userId)
    .eq("flag", AI_DASHBOARD_FLAG)
    .maybeSingle();

  if (error) {
    console.error("feature_flags lookup failed:", error.message);
    return false;
  }
  return data?.enabled === true;
}
