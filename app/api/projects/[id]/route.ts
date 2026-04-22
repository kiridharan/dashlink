import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteProject, updateProject } from "@/lib/supabase/queries";
import { DEFAULT_THEME_ID } from "@/lib/dashlink/themes";
import type { DashboardProjectInput } from "@/lib/supabase/types";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseAuthConfig(value: unknown): DashboardProjectInput["authConfig"] {
  return isObject(value)
    ? (value as unknown as DashboardProjectInput["authConfig"])
    : { type: "none" };
}

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null };
  }

  return { supabase, user };
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { supabase, user } = await requireUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  if (!isObject(body)) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const input: DashboardProjectInput = {
    name: typeof body.name === "string" ? body.name : "Untitled Dashboard",
    apiUrl: typeof body.apiUrl === "string" ? body.apiUrl : "",
    authConfig: parseAuthConfig(body.authConfig),
    dataPath: typeof body.dataPath === "string" ? body.dataPath : "",
    config: null,
    widgets: Array.isArray(body.widgets)
      ? (body.widgets as DashboardProjectInput["widgets"])
      : [],
    layout: Array.isArray(body.layout)
      ? (body.layout as DashboardProjectInput["layout"])
      : [],
    data: Array.isArray(body.data)
      ? (body.data as DashboardProjectInput["data"])
      : [],
    theme: typeof body.theme === "string" ? body.theme : DEFAULT_THEME_ID,
    filters: Array.isArray(body.filters)
      ? (body.filters as DashboardProjectInput["filters"])
      : [],
    isPublic: typeof body.isPublic === "boolean" ? body.isPublic : false,
  };

  try {
    const versionSummary =
      typeof body.versionSummary === "string" && body.versionSummary.trim()
        ? body.versionSummary.trim().slice(0, 120)
        : undefined;
    const project = await updateProject(supabase, id, input, {
      versionSummary,
    });
    return NextResponse.json({ project });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not update project";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { supabase, user } = await requireUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    await deleteProject(supabase, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not delete project";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
