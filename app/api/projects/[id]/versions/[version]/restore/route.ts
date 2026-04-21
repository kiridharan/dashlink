import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { restoreProjectVersion } from "@/lib/supabase/queries";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string; version: string }> },
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, version } = await context.params;
  const versionNumber = Number(version);

  if (!Number.isFinite(versionNumber) || versionNumber < 1) {
    return NextResponse.json(
      { error: "Invalid version number" },
      { status: 400 },
    );
  }

  try {
    const project = await restoreProjectVersion(supabase, id, versionNumber);
    return NextResponse.json({ project });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Restore failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
