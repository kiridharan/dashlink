import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createProject } from "@/lib/supabase/queries";
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

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    isPublic: typeof body.isPublic === "boolean" ? body.isPublic : true,
  };

  try {
    const project = await createProject(supabase, input);
    return NextResponse.json({ project });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create project";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
