import type {
  FilterControl,
  DashWidget,
  GridItem,
} from "@/lib/dashlink/builder-types";
import type {
  AuthConfig,
  DashboardConfig,
  Dataset,
} from "@/lib/dashlink/types";

export interface DashboardProject {
  id: string;
  ownerId: string;
  publicSlug: string;
  isPublic: boolean;
  name: string;
  apiUrl: string;
  authConfig: AuthConfig;
  dataPath: string;
  createdAt: string;
  updatedAt: string;
  config: DashboardConfig | null;
  widgets: DashWidget[];
  layout: GridItem[];
  data: Dataset;
  theme: string;
  filters: FilterControl[];
  /** Scheduled refresh: cadence in minutes (null/undefined = manual only). */
  refreshEnabled: boolean;
  refreshIntervalMinutes: number | null;
  lastRefreshedAt: string | null;
}

export interface DashboardProjectInput {
  name: string;
  apiUrl: string;
  authConfig: AuthConfig;
  dataPath: string;
  config: DashboardConfig | null;
  widgets: DashWidget[];
  layout: GridItem[];
  data: Dataset;
  theme: string;
  filters: FilterControl[];
  isPublic?: boolean;
  refreshEnabled?: boolean;
  refreshIntervalMinutes?: number | null;
}
