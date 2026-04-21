import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createAlert,
  listAlerts,
  type AlertInput,
  type AlertOperator,
} from "@/lib/supabase/alerts";

const VALID_OPERATORS: AlertOperator[] = [
  "gt",
  "lt",
  "gte",
  "lte",
  "eq",
  "change_pct",
];

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

async function requireOwnership(projectId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, owner: false as const };

  const { data } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("owner_id", user.id)
    .maybeSingle();

  return { supabase, owner: Boolean(data) };
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const { supabase, owner } = await requireOwnership(id);
  if (!owner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const alerts = await listAlerts(supabase, id);
    return NextResponse.json({ alerts });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const { supabase, owner } = await requireOwnership(id);
  if (!owner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isObject(body) || typeof body.widgetId !== "string") {
    return NextResponse.json(
      { error: "widgetId is required" },
      { status: 400 },
    );
  }

  const operator = VALID_OPERATORS.includes(body.operator as AlertOperator)
    ? (body.operator as AlertOperator)
    : "gt";

  const input: AlertInput = {
    widgetId: body.widgetId,
    label: typeof body.label === "string" ? body.label : "Alert",
    operator,
    threshold: typeof body.threshold === "number" ? body.threshold : 0,
    frequencyMinutes:
      typeof body.frequencyMinutes === "number" ? body.frequencyMinutes : 60,
    webhookUrl:
      typeof body.webhookUrl === "string" && body.webhookUrl.startsWith("http")
        ? body.webhookUrl
        : null,
    email: typeof body.email === "string" ? body.email : null,
    enabled: typeof body.enabled === "boolean" ? body.enabled : true,
  };

  try {
    const alert = await createAlert(supabase, id, input);
    return NextResponse.json({ alert });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 },
    );
  }
}
