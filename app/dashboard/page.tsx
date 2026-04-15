import { redirect } from "next/navigation";
import DashboardPageClient from "@/components/dashboard/DashboardPageClient";
import { listProjects } from "@/lib/supabase/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const projects = await listProjects(supabase);
  const userLabel =
    (typeof user.user_metadata.full_name === "string" &&
      user.user_metadata.full_name) ||
    user.email ||
    "Account";

  return (
    <DashboardPageClient initialProjects={projects} userLabel={userLabel} />
  );
}
