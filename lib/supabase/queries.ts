import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DashboardFilter,
  DashWidget,
  GridItem,
} from "@/lib/dashlink/builder-types";
import type {
  AuthConfig,
  DashboardConfig,
  Dataset,
} from "@/lib/dashlink/types";
import { DEFAULT_THEME_ID } from "@/lib/dashlink/themes";
import type { DashboardProject, DashboardProjectInput } from "./types";

interface ProjectRow {
  id: string;
  owner_id: string;
  public_slug: string;
  is_public: boolean;
  name: string;
  api_url: string;
  auth_config: unknown;
  data_path: string;
  created_at: string;
  updated_at: string;
  config: unknown;
  widgets: unknown;
  layout: unknown;
  theme: string;
  filters: unknown;
}

interface SnapshotRow {
  project_id: string;
  data: unknown;
  row_count: number;
  synced_at: string;
}

interface PublicDashboardRow {
  id: string;
  public_slug: string;
  name: string;
  api_url: string;
  widgets: unknown;
  layout: unknown;
  theme: string;
  data: unknown;
  row_count: number;
  synced_at: string;
}

function asAuthConfig(value: unknown): AuthConfig {
  if (!value || typeof value !== "object" || !("type" in value)) {
    return { type: "none" };
  }

  return value as AuthConfig;
}

function asDashboardConfig(value: unknown): DashboardConfig | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  return value as DashboardConfig;
}

function asWidgets(value: unknown): DashWidget[] {
  return Array.isArray(value) ? (value as DashWidget[]) : [];
}

function asLayout(value: unknown): GridItem[] {
  return Array.isArray(value) ? (value as GridItem[]) : [];
}

function asDataset(value: unknown): Dataset {
  return Array.isArray(value) ? (value as Dataset) : [];
}

function asFilters(value: unknown): DashboardFilter[] {
  return Array.isArray(value) ? (value as DashboardFilter[]) : [];
}

function mapProjectRow(
  row: ProjectRow,
  snapshot?: SnapshotRow | null,
): DashboardProject {
  return {
    id: row.id,
    ownerId: row.owner_id,
    publicSlug: row.public_slug,
    isPublic: row.is_public,
    name: row.name,
    apiUrl: row.api_url,
    authConfig: asAuthConfig(row.auth_config),
    dataPath: row.data_path,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    config: asDashboardConfig(row.config),
    widgets: asWidgets(row.widgets),
    layout: asLayout(row.layout),
    data: asDataset(snapshot?.data),
    theme: row.theme || DEFAULT_THEME_ID,
    filters: asFilters(row.filters),
  };
}

async function fetchSnapshots(
  client: SupabaseClient,
  projectIds: string[],
): Promise<Map<string, SnapshotRow>> {
  const snapshots = new Map<string, SnapshotRow>();

  if (projectIds.length === 0) {
    return snapshots;
  }

  const { data, error } = await client
    .from("project_snapshots")
    .select("project_id, data, row_count, synced_at")
    .in("project_id", projectIds);

  if (error) {
    throw new Error(error.message);
  }

  for (const snapshot of (data ?? []) as SnapshotRow[]) {
    snapshots.set(snapshot.project_id, snapshot);
  }

  return snapshots;
}

function toProjectPayload(input: DashboardProjectInput) {
  return {
    name: input.name.trim() || "Untitled Dashboard",
    api_url: input.apiUrl.trim(),
    auth_config: input.authConfig,
    data_path: input.dataPath,
    config: input.config,
    widgets: input.widgets,
    layout: input.layout,
    theme: input.theme || DEFAULT_THEME_ID,
    filters: input.filters,
    is_public: input.isPublic ?? true,
  };
}

function createPublicSlug() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 18);
}

export async function listProjects(client: SupabaseClient) {
  const { data, error } = await client
    .from("projects")
    .select(
      "id, owner_id, public_slug, is_public, name, api_url, auth_config, data_path, created_at, updated_at, config, widgets, layout, theme, filters",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as ProjectRow[];
  const snapshots = await fetchSnapshots(
    client,
    rows.map((row) => row.id),
  );

  return rows.map((row) => mapProjectRow(row, snapshots.get(row.id)));
}

export async function getProjectById(
  client: SupabaseClient,
  projectId: string,
) {
  const { data, error } = await client
    .from("projects")
    .select(
      "id, owner_id, public_slug, is_public, name, api_url, auth_config, data_path, created_at, updated_at, config, widgets, layout, theme, filters",
    )
    .eq("id", projectId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const snapshots = await fetchSnapshots(client, [projectId]);
  return mapProjectRow(data as ProjectRow, snapshots.get(projectId));
}

export async function createProject(
  client: SupabaseClient,
  input: DashboardProjectInput,
) {
  const payload = toProjectPayload(input);
  let insertError: Error | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, error } = await client
      .from("projects")
      .insert({
        ...payload,
        public_slug: createPublicSlug(),
      })
      .select(
        "id, owner_id, public_slug, is_public, name, api_url, auth_config, data_path, created_at, updated_at, config, widgets, layout, theme, filters",
      )
      .single();

    if (error) {
      insertError = new Error(error.message);
      continue;
    }

    const snapshotPayload = {
      project_id: data.id,
      data: input.data,
      row_count: input.data.length,
      synced_at: new Date().toISOString(),
    };

    const { error: snapshotError } = await client
      .from("project_snapshots")
      .insert(snapshotPayload);

    if (snapshotError) {
      throw new Error(snapshotError.message);
    }

    return mapProjectRow(data as ProjectRow, snapshotPayload);
  }

  throw insertError ?? new Error("Could not create project.");
}

export async function updateProject(
  client: SupabaseClient,
  projectId: string,
  input: DashboardProjectInput,
) {
  const { data, error } = await client
    .from("projects")
    .update(toProjectPayload(input))
    .eq("id", projectId)
    .select(
      "id, owner_id, public_slug, is_public, name, api_url, auth_config, data_path, created_at, updated_at, config, widgets, layout, theme, filters",
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const snapshotPayload = {
    project_id: projectId,
    data: input.data,
    row_count: input.data.length,
    synced_at: new Date().toISOString(),
  };

  const { error: snapshotError } = await client
    .from("project_snapshots")
    .upsert(snapshotPayload, { onConflict: "project_id" });

  if (snapshotError) {
    throw new Error(snapshotError.message);
  }

  return mapProjectRow(data as ProjectRow, snapshotPayload);
}

export async function deleteProject(client: SupabaseClient, projectId: string) {
  const { error } = await client.from("projects").delete().eq("id", projectId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getPublicProjectBySlug(
  client: SupabaseClient,
  slug: string,
) {
  const { data, error } = await client.rpc("get_public_dashboard_by_slug", {
    share_slug: slug,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = Array.isArray(data)
    ? ((data[0] as PublicDashboardRow | undefined) ?? null)
    : ((data as PublicDashboardRow | null) ?? null);

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    ownerId: "",
    publicSlug: row.public_slug,
    isPublic: true,
    name: row.name,
    apiUrl: row.api_url,
    authConfig: { type: "none" as const },
    dataPath: "",
    createdAt: row.synced_at,
    updatedAt: row.synced_at,
    config: null,
    widgets: asWidgets(row.widgets),
    layout: asLayout(row.layout),
    data: asDataset(row.data),
    theme: row.theme || DEFAULT_THEME_ID,
    filters: [],
  } satisfies DashboardProject;
}
