// ---------------------------------------------------------------------------
// Core primitive types
// ---------------------------------------------------------------------------

export type DataValue = string | number | null | boolean;
export type DataRow = Record<string, DataValue>;
export type Dataset = DataRow[];

// ---------------------------------------------------------------------------
// Chart / dashboard config
// ---------------------------------------------------------------------------

export type ChartType = "line" | "bar";

export interface ChartConfig {
  type: ChartType;
  x: string;
  y: string;
  label: string;
}

export interface DashboardConfig {
  title: string;
  apiUrl: string;
  charts: ChartConfig[];
  /** Numeric fields to display as KPI summary cards */
  kpis: string[];
  showTable: boolean;
}

// ---------------------------------------------------------------------------
// Demo / storage record (mirrors what Supabase will eventually store)
// ---------------------------------------------------------------------------

export interface DemoDashboard {
  id: string;
  api_url: string;
  config: DashboardConfig;
  data: Dataset;
  is_public: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Server-action response
// ---------------------------------------------------------------------------

export type GenerateResult =
  | { success: true; id: string }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Derived / computed types
// ---------------------------------------------------------------------------

export interface KpiSummary {
  field: string;
  label: string;
  value: number;
  formatted: string;
}
