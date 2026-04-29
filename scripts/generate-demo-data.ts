/**
 * generate-demo-data.ts
 *
 * Generates public/sample.json — a rich demo dataset that exercises every
 * DashLink feature:
 *
 *   • KPI cards         (sum, avg, count, countDistinct, min, max)
 *   • Line chart        (date × numeric, with time-grain bucketing)
 *   • Bar chart         (categorical × numeric, topN, sort, showOtherBucket)
 *   • Pie chart         (categorical value distribution)
 *   • Table widget      (all columns, multi-column search)
 *   • Filters           (select, multiSelect, dateRange, numberRange, search)
 *   • 200 realistic rows so every filter / aggregation has something to show
 *
 * Usage:
 *   pnpm tsx scripts/generate-demo-data.ts
 *
 * Output:
 *   public/sample.json
 */

import { writeFileSync } from "fs";
import { join } from "path";

// ──────────────────────────────────────────────────────────────────────────────
// Reference data
// ──────────────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "Electronics",
  "Apparel",
  "Home & Garden",
  "Sports",
  "Books",
  "Toys",
  "Beauty",
  "Automotive",
] as const;

const REGIONS = ["North", "South", "East", "West", "Central"] as const;

const SALES_CHANNELS = [
  "Online",
  "In-Store",
  "Mobile App",
  "Marketplace",
] as const;

const STATUSES = ["completed", "pending", "refunded", "cancelled"] as const;

const PAYMENT_METHODS = [
  "Credit Card",
  "Debit Card",
  "PayPal",
  "Bank Transfer",
] as const;

// ──────────────────────────────────────────────────────────────────────────────
// Deterministic pseudo-random helpers (no external deps)
// ──────────────────────────────────────────────────────────────────────────────

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function between(min: number, max: number): number {
  return Math.round(min + rand() * (max - min));
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// ──────────────────────────────────────────────────────────────────────────────
// Row generation — 200 rows, Jan 2024 – Apr 2026
// ──────────────────────────────────────────────────────────────────────────────

interface OrderRow {
  order_id: string;
  order_date: string; // ISO date — dateRange filter, line chart x-axis
  category: string; // select / multiSelect filter, bar chart x-axis
  region: string; // select / multiSelect filter, pie chart category
  sales_channel: string; // select filter
  status: string; // multiSelect filter
  payment_method: string; // select filter
  revenue: number; // KPI sum, line y-axis
  units_sold: number; // KPI sum / avg
  discount_pct: number; // numberRange filter, KPI avg
  customer_id: number; // KPI countDistinct
  cost: number; // KPI sum (hidden by default in table)
  profit: number; // KPI sum / bar chart y-axis
  rating: number | null; // KPI avg, numberRange filter (nullable)
}

const startTimestamp = new Date("2024-01-01").getTime();
const endTimestamp = new Date("2026-04-29").getTime();

const rows: OrderRow[] = Array.from({ length: 200 }, (_, i) => {
  const ts = startTimestamp + rand() * (endTimestamp - startTimestamp);
  const d = new Date(ts);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();

  const category = pick(CATEGORIES);
  const region = pick(REGIONS);
  const channel = pick(SALES_CHANNELS);
  const status = pick(STATUSES);
  const payment = pick(PAYMENT_METHODS);

  const units = between(1, 50);
  const unitCost = between(10, 500);
  const discount = between(0, 30); // %
  const price = Math.round(unitCost * (1 + rand() * 0.6));
  const revenue = Math.round(units * price * (1 - discount / 100));
  const cost = units * unitCost;
  const profit = revenue - cost;
  const rating = rand() < 0.1 ? null : Math.round(rand() * 40 + 10) / 10; // 1.0 – 5.0 or null

  return {
    order_id: `ORD-${String(i + 1).padStart(5, "0")}`,
    order_date: isoDate(year, month, day),
    category,
    region,
    sales_channel: channel,
    status,
    payment_method: payment,
    revenue,
    units_sold: units,
    discount_pct: discount,
    customer_id: between(1001, 1200), // 200 unique customers across 200 rows
    cost,
    profit,
    rating,
  };
});

// Sort by date ascending so the line chart looks natural
rows.sort((a, b) => a.order_date.localeCompare(b.order_date));

// ──────────────────────────────────────────────────────────────────────────────
// Build output structure
// ──────────────────────────────────────────────────────────────────────────────

const output = {
  /**
   * ── METADATA ──────────────────────────────────────────────────────────────
   * Paste this JSON URL into DashLink's URL input to explore the dataset.
   * When hosting locally: `pnpm tsx scripts/generate-demo-data.ts` writes
   * public/sample.json, then access it at:
   *   http://localhost:3000/sample.json
   * or on production:
   *   https://dashlink.kiridharan.dev/sample.json
   */
  _meta: {
    description:
      "DashLink demo dataset — 200 e-commerce orders, Jan 2024 – Apr 2026",
    generated_at: new Date().toISOString(),
    row_count: rows.length,
    fields: {
      order_id: "string  — unique order identifier",
      order_date: "ISO date — use as Line chart X axis or Date Range filter",
      category:
        "string  — product category (8 values) — use as Bar/Pie X axis or Select filter",
      region:
        "string  — sales region (5 values) — use as Pie category or MultiSelect filter",
      sales_channel:
        "string  — Online / In-Store / Mobile App / Marketplace — Select filter",
      status:
        "string  — completed / pending / refunded / cancelled — MultiSelect filter",
      payment_method:
        "string  — Credit Card / Debit Card / PayPal / Bank Transfer — Select filter",
      revenue: "number  — line item revenue in USD — KPI sum, Line Y axis",
      units_sold: "number  — units in order — KPI sum / avg",
      discount_pct: "number  — discount % 0-30 — Number Range filter, KPI avg",
      customer_id: "number  — customer identifier — KPI countDistinct",
      cost: "number  — cost of goods — KPI sum",
      profit: "number  — revenue - cost — Bar chart Y axis, KPI sum",
      rating:
        "number|null — product rating 1.0-5.0 (10% null) — KPI avg, Number Range filter",
    },
    suggested_widgets: {
      kpi_cards: [
        { field: "revenue", metric: "sum", label: "Total Revenue" },
        { field: "profit", metric: "sum", label: "Total Profit" },
        { field: "units_sold", metric: "sum", label: "Units Sold" },
        {
          field: "customer_id",
          metric: "countDistinct",
          label: "Unique Customers",
        },
        { field: "discount_pct", metric: "avg", label: "Avg Discount %" },
        { field: "rating", metric: "avg", label: "Avg Rating" },
      ],
      line_chart: {
        x: "order_date",
        y: "revenue",
        metric: "sum",
        timeGrain: "month",
        label: "Monthly Revenue",
      },
      bar_chart_by_category: {
        x: "category",
        y: "profit",
        metric: "sum",
        sort: "desc",
        topN: 8,
        label: "Profit by Category",
      },
      bar_chart_by_region: {
        x: "region",
        y: "revenue",
        metric: "sum",
        sort: "desc",
        label: "Revenue by Region",
      },
      pie_chart: {
        category: "region",
        value: "revenue",
        metric: "sum",
        label: "Revenue Share by Region",
      },
      table: {
        columns: [
          "order_id",
          "order_date",
          "category",
          "region",
          "sales_channel",
          "status",
          "revenue",
          "units_sold",
          "profit",
          "rating",
        ],
      },
      filters: [
        {
          id: "f-date",
          type: "dateRange",
          field: "order_date",
          label: "Order Date",
        },
        {
          id: "f-cat",
          type: "multiSelect",
          field: "category",
          label: "Category",
        },
        {
          id: "f-region",
          type: "multiSelect",
          field: "region",
          label: "Region",
        },
        {
          id: "f-channel",
          type: "select",
          field: "sales_channel",
          label: "Sales Channel",
        },
        {
          id: "f-status",
          type: "multiSelect",
          field: "status",
          label: "Status",
        },
        {
          id: "f-revenue",
          type: "numberRange",
          field: "revenue",
          label: "Revenue ($)",
        },
        {
          id: "f-rating",
          type: "numberRange",
          field: "rating",
          label: "Rating",
        },
        {
          id: "f-search",
          type: "search",
          fields: ["order_id", "category", "region", "sales_channel", "status"],
          label: "Search",
        },
      ],
    },
  },

  // ── DATASET ───────────────────────────────────────────────────────────────
  // DashLink expects the API response to be either an array at root level
  // OR an object with a `data` key containing the array.
  data: rows,
};

// ──────────────────────────────────────────────────────────────────────────────
// Write file
// ──────────────────────────────────────────────────────────────────────────────

const outPath = join(process.cwd(), "public", "sample.json");
writeFileSync(outPath, JSON.stringify(output, null, 2), "utf8");

console.log(`✓ Wrote ${rows.length} rows → ${outPath}`);
console.log(`  Access at: https://dashlink.kiridharan.dev/sample.json`);
console.log(`  Or locally: http://localhost:3000/sample.json`);
