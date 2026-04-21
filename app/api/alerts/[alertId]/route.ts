import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteAlert, updateAlert } from "@/lib/supabase/alerts";

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ alertId: string }> },
) {
  const { supabase, user } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { alertId } = await context.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const patch = (body ?? {}) as Record<string, unknown>;

  try {
    const alert = await updateAlert(supabase, alertId, {
      label: typeof patch.label === "string" ? patch.label : undefined,
      threshold:
        typeof patch.threshold === "number" ? patch.threshold : undefined,
      frequencyMinutes:
        typeof patch.frequencyMinutes === "number"
          ? patch.frequencyMinutes
          : undefined,
      webhookUrl:
        typeof patch.webhookUrl === "string" || patch.webhookUrl === null
          ? (patch.webhookUrl as string | null)
          : undefined,
      email:
        typeof patch.email === "string" || patch.email === null
          ? (patch.email as string | null)
          : undefined,
      enabled: typeof patch.enabled === "boolean" ? patch.enabled : undefined,
    });
    return NextResponse.json({ alert });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ alertId: string }> },
) {
  const { supabase, user } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { alertId } = await context.params;

  try {
    await deleteAlert(supabase, alertId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 },
    );
  }
}
