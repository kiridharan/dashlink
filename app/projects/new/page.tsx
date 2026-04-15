import { redirect } from "next/navigation";
import CreateProjectWizard from "@/components/builder/CreateProjectWizard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function NewProjectPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <CreateProjectWizard mode="page" />
    </div>
  );
}
