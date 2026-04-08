import type { Dataset, DemoDashboard } from "./types";

// ---------------------------------------------------------------------------
// Sample datasets
// ---------------------------------------------------------------------------

/**
 * Monthly sales dataset — 12 rows, 6 fields.
 * Designed so schema detection produces:
 *   • line chart  : month  × revenue
 *   • bar chart   : region × revenue
 *   • KPIs        : revenue, orders, customers, refunds
 *   • table       : all columns
 */
export const DEMO_SALES_DATA: Dataset = [
  {
    month: "Jan",
    revenue: 42300,
    orders: 318,
    customers: 245,
    region: "North",
    refunds: 14,
  },
  {
    month: "Feb",
    revenue: 53100,
    orders: 412,
    customers: 312,
    region: "South",
    refunds: 9,
  },
  {
    month: "Mar",
    revenue: 48700,
    orders: 376,
    customers: 289,
    region: "East",
    refunds: 11,
  },
  {
    month: "Apr",
    revenue: 61200,
    orders: 489,
    customers: 378,
    region: "West",
    refunds: 7,
  },
  {
    month: "May",
    revenue: 55800,
    orders: 444,
    customers: 341,
    region: "North",
    refunds: 15,
  },
  {
    month: "Jun",
    revenue: 72400,
    orders: 581,
    customers: 447,
    region: "South",
    refunds: 6,
  },
  {
    month: "Jul",
    revenue: 69300,
    orders: 553,
    customers: 425,
    region: "East",
    refunds: 18,
  },
  {
    month: "Aug",
    revenue: 78900,
    orders: 630,
    customers: 491,
    region: "West",
    refunds: 10,
  },
  {
    month: "Sep",
    revenue: 81200,
    orders: 648,
    customers: 503,
    region: "North",
    refunds: 8,
  },
  {
    month: "Oct",
    revenue: 88300,
    orders: 704,
    customers: 547,
    region: "South",
    refunds: 12,
  },
  {
    month: "Nov",
    revenue: 95100,
    orders: 760,
    customers: 589,
    region: "East",
    refunds: 5,
  },
  {
    month: "Dec",
    revenue: 112500,
    orders: 900,
    customers: 698,
    region: "West",
    refunds: 3,
  },
];

// ---------------------------------------------------------------------------
// Pre-built demo dashboards (keyed by ID)
// Replaces Supabase storage while the backend is not yet wired up.
// ---------------------------------------------------------------------------

export const DEMO_DASHBOARDS: Record<string, DemoDashboard> = {
  "demo-sales": {
    id: "demo-sales",
    api_url: "https://api.example.com/v1/sales",
    is_public: true,
    created_at: "2026-04-08T00:00:00.000Z",
    config: {
      title: "Sales Dashboard",
      apiUrl: "https://api.example.com/v1/sales",
      charts: [
        {
          type: "line",
          x: "month",
          y: "revenue",
          label: "Revenue Over Time",
        },
        {
          type: "bar",
          x: "region",
          y: "revenue",
          label: "Revenue by Region",
        },
      ],
      kpis: ["revenue", "orders", "customers", "refunds"],
      showTable: true,
    },
    data: DEMO_SALES_DATA,
  },
};

/** Placeholder ID returned by the generate action for any URL while DB is pending. */
export const DEMO_DASHBOARD_ID = "demo-sales";
