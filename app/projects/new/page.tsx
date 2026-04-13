"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import CreateProjectWizard from "@/components/builder/CreateProjectWizard";
import { useAuthStore } from "@/lib/store/auth-store";
import { useProjectStore } from "@/lib/store/project-store";

export default function NewProjectPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { createProjectFull } = useProjectStore();

  useEffect(() => {
    if (!user) router.replace("/login");
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-zinc-50">
      <CreateProjectWizard
        mode="page"
        onClose={() => router.push("/dashboard")}
        onCreated={(id) => router.push(`/projects/${id}`)}
        createProjectFull={createProjectFull}
      />
    </div>
  );
}
