import BuilderLayout from "@/components/builder/BuilderLayout";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectBuilderPage({ params }: Props) {
  const { id } = await params;
  return <BuilderLayout projectId={id} />;
}
