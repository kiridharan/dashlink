import { notFound, redirect } from "next/navigation";
import BuilderLayout from "@/components/builder/BuilderLayout";
import { getProjectById } from "@/lib/supabase/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectBuilderPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const project = await getProjectById(supabase, id);

  if (!project) {
    notFound();
  }

  return <BuilderLayout initialProject={project} />;
}
