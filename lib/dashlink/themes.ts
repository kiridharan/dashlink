// Dashboard theme definitions.
// Covers design-system-inspired themes (shadcn, Material, Tailwind UI, PrimeReact, etc.)
// as well as color-focused palettes. All values are used via inline `style` props
// and passed into Recharts — no Tailwind class-name magic needed at render time.

// ─────────────────────────────────────────────────────────────────────────────
// Chart style tokens — control HOW charts look regardless of color
// ─────────────────────────────────────────────────────────────────────────────
export interface ChartStyle {
  // Bars
  barRadius: [number, number, number, number]; // [TL, TR, BR, BL]
  barMaxWidth: number; // px — cap bar width so thin bars look good

  // Lines
  lineType:
    | "monotone"
    | "linear"
    | "step"
    | "stepBefore"
    | "stepAfter"
    | "natural";
  lineStrokeWidth: number;
  lineDot: boolean;
  lineDotRadius: number;
  lineArea: boolean; // fill area under line
  lineAreaOpacity: number;

  // Grid
  showGrid: boolean;
  gridDash: string; // e.g. "3 3" | "4 2" | "0"

  // Cards
  cardRadius: number; // px
  cardShadow: string;

  // Tooltip
  tooltipRadius: number; // px

  // Axis labels
  axisLabelSize: number; // px font-size
}

export interface DashTheme {
  id: string;
  name: string;
  /** Design-system category label shown in the selector */
  category: "design-system" | "color";

  // ---- Page / structural ----
  pageBg: string;
  headerBg: string;
  headerBorderColor: string;

  // ---- Widget cards ----
  cardBg: string;
  cardBorderColor: string;
  dragHandleBg: string;
  dragHandleBorderColor: string;

  // ---- Text ----
  titleColor: string;
  mutedColor: string;
  kpiValueColor: string;

  // ---- Table ----
  tableHeaderBg: string;
  tableHeaderText: string;
  tableRowEvenBg: string;
  tableRowOddBg: string;
  tableText: string;
  tableBorderColor: string;

  // ---- Charts (Recharts) ----
  chartColors: string[];
  gridLineColor: string;
  axisTickColor: string;
  tooltipBg: string;
  tooltipBorderColor: string;

  // ---- Chart + layout style tokens ----
  chart: ChartStyle;

  // ---- Selector UI ----
  preview: [string, string, string];
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared chart style presets
// ─────────────────────────────────────────────────────────────────────────────

const cleanChart: ChartStyle = {
  barRadius: [4, 4, 0, 0],
  barMaxWidth: 40,
  lineType: "monotone",
  lineStrokeWidth: 2,
  lineDot: false,
  lineDotRadius: 3,
  lineArea: false,
  lineAreaOpacity: 0.15,
  showGrid: true,
  gridDash: "3 3",
  cardRadius: 12,
  cardShadow: "0 1px 3px 0 rgba(0,0,0,0.07)",
  tooltipRadius: 8,
  axisLabelSize: 10,
};

const materialChart: ChartStyle = {
  barRadius: [6, 6, 0, 0],
  barMaxWidth: 48,
  lineType: "monotone",
  lineStrokeWidth: 2.5,
  lineDot: true,
  lineDotRadius: 4,
  lineArea: true,
  lineAreaOpacity: 0.1,
  showGrid: true,
  gridDash: "0",
  cardRadius: 16,
  cardShadow: "0 2px 8px 0 rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)",
  tooltipRadius: 4,
  axisLabelSize: 10,
};

const flatChart: ChartStyle = {
  barRadius: [2, 2, 0, 0],
  barMaxWidth: 36,
  lineType: "linear",
  lineStrokeWidth: 1.5,
  lineDot: true,
  lineDotRadius: 2,
  lineArea: false,
  lineAreaOpacity: 0,
  showGrid: true,
  gridDash: "4 2",
  cardRadius: 4,
  cardShadow: "none",
  tooltipRadius: 2,
  axisLabelSize: 11,
};

const softChart: ChartStyle = {
  barRadius: [8, 8, 4, 4],
  barMaxWidth: 44,
  lineType: "natural",
  lineStrokeWidth: 2,
  lineDot: false,
  lineDotRadius: 4,
  lineArea: true,
  lineAreaOpacity: 0.18,
  showGrid: true,
  gridDash: "3 3",
  cardRadius: 20,
  cardShadow: "0 4px 24px 0 rgba(0,0,0,0.06)",
  tooltipRadius: 12,
  axisLabelSize: 10,
};

const stepChart: ChartStyle = {
  barRadius: [0, 0, 0, 0],
  barMaxWidth: 32,
  lineType: "step",
  lineStrokeWidth: 1.5,
  lineDot: false,
  lineDotRadius: 3,
  lineArea: false,
  lineAreaOpacity: 0,
  showGrid: true,
  gridDash: "2 4",
  cardRadius: 8,
  cardShadow: "none",
  tooltipRadius: 6,
  axisLabelSize: 10,
};

// ─────────────────────────────────────────────────────────────────────────────
// ── DESIGN SYSTEM THEMES ────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

// shadcn/ui — neutral grays, minimal borders, system font feel
const shadcn: DashTheme = {
  id: "shadcn",
  name: "shadcn/ui",
  category: "design-system",
  pageBg: "#fafafa",
  headerBg: "rgba(255,255,255,0.95)",
  headerBorderColor: "#e4e4e7",
  cardBg: "#ffffff",
  cardBorderColor: "#e4e4e7",
  dragHandleBg: "transparent",
  dragHandleBorderColor: "#f4f4f5",
  titleColor: "#09090b",
  mutedColor: "#71717a",
  kpiValueColor: "#09090b",
  tableHeaderBg: "#fafafa",
  tableHeaderText: "#71717a",
  tableRowEvenBg: "#ffffff",
  tableRowOddBg: "#fafafa",
  tableText: "#3f3f46",
  tableBorderColor: "#e4e4e7",
  chartColors: [
    "#18181b",
    "#3f3f46",
    "#6366f1",
    "#8b5cf6",
    "#06b6d4",
    "#10b981",
  ],
  gridLineColor: "#f4f4f5",
  axisTickColor: "#a1a1aa",
  tooltipBg: "#ffffff",
  tooltipBorderColor: "#e4e4e7",
  chart: cleanChart,
  preview: ["#18181b", "#6366f1", "#8b5cf6"],
};

// shadcn/ui Dark
const shadcnDark: DashTheme = {
  id: "shadcn-dark",
  name: "shadcn Dark",
  category: "design-system",
  pageBg: "#09090b",
  headerBg: "rgba(9,9,11,0.95)",
  headerBorderColor: "#27272a",
  cardBg: "#18181b",
  cardBorderColor: "#27272a",
  dragHandleBg: "transparent",
  dragHandleBorderColor: "#3f3f46",
  titleColor: "#fafafa",
  mutedColor: "#71717a",
  kpiValueColor: "#fafafa",
  tableHeaderBg: "#27272a",
  tableHeaderText: "#71717a",
  tableRowEvenBg: "#18181b",
  tableRowOddBg: "#1c1c20",
  tableText: "#d4d4d8",
  tableBorderColor: "#3f3f46",
  chartColors: [
    "#a78bfa",
    "#60a5fa",
    "#34d399",
    "#fb923c",
    "#f472b6",
    "#facc15",
  ],
  gridLineColor: "#27272a",
  axisTickColor: "#52525b",
  tooltipBg: "#27272a",
  tooltipBorderColor: "#3f3f46",
  chart: cleanChart,
  preview: ["#09090b", "#a78bfa", "#60a5fa"],
};

// Material Design 3 — blue/teal, elevation shadows, 16px radius
const material: DashTheme = {
  id: "material",
  name: "Material",
  category: "design-system",
  pageBg: "#f6f8fc",
  headerBg: "rgba(232,240,250,0.95)",
  headerBorderColor: "#c5d8f5",
  cardBg: "#ffffff",
  cardBorderColor: "#dce8fb",
  dragHandleBg: "transparent",
  dragHandleBorderColor: "#e8f0fe",
  titleColor: "#1a1c1e",
  mutedColor: "#44678a",
  kpiValueColor: "#1565c0",
  tableHeaderBg: "#e8f0fe",
  tableHeaderText: "#1565c0",
  tableRowEvenBg: "#ffffff",
  tableRowOddBg: "#f5f8ff",
  tableText: "#1a1c1e",
  tableBorderColor: "#dce8fb",
  chartColors: [
    "#1976d2",
    "#42a5f5",
    "#00897b",
    "#26c6da",
    "#7b1fa2",
    "#ab47bc",
  ],
  gridLineColor: "#e8f0fe",
  axisTickColor: "#78909c",
  tooltipBg: "#ffffff",
  tooltipBorderColor: "#c5d8f5",
  chart: materialChart,
  preview: ["#1976d2", "#42a5f5", "#00897b"],
};

// Material Dark
const materialDark: DashTheme = {
  id: "material-dark",
  name: "Material Dark",
  category: "design-system",
  pageBg: "#1a1c1e",
  headerBg: "rgba(30,34,40,0.95)",
  headerBorderColor: "#2d3748",
  cardBg: "#23272f",
  cardBorderColor: "#2d3748",
  dragHandleBg: "transparent",
  dragHandleBorderColor: "#374151",
  titleColor: "#e8eaed",
  mutedColor: "#8ab4f8",
  kpiValueColor: "#8ab4f8",
  tableHeaderBg: "#2d3748",
  tableHeaderText: "#8ab4f8",
  tableRowEvenBg: "#23272f",
  tableRowOddBg: "#282c34",
  tableText: "#c9d1d9",
  tableBorderColor: "#374151",
  chartColors: [
    "#8ab4f8",
    "#81c995",
    "#f28b82",
    "#fdd663",
    "#c58af9",
    "#78d9ec",
  ],
  gridLineColor: "#2d3748",
  axisTickColor: "#5f6368",
  tooltipBg: "#2d3748",
  tooltipBorderColor: "#374151",
  chart: materialChart,
  preview: ["#1a1c1e", "#8ab4f8", "#81c995"],
};

// Tailwind UI — slate/indigo palette, clean and crisp
const tailwindUI: DashTheme = {
  id: "tailwind",
  name: "Tailwind UI",
  category: "design-system",
  pageBg: "#f8fafc",
  headerBg: "rgba(248,250,252,0.95)",
  headerBorderColor: "#e2e8f0",
  cardBg: "#ffffff",
  cardBorderColor: "#e2e8f0",
  dragHandleBg: "transparent",
  dragHandleBorderColor: "#f1f5f9",
  titleColor: "#0f172a",
  mutedColor: "#64748b",
  kpiValueColor: "#4f46e5",
  tableHeaderBg: "#f8fafc",
  tableHeaderText: "#475569",
  tableRowEvenBg: "#ffffff",
  tableRowOddBg: "#f8fafc",
  tableText: "#334155",
  tableBorderColor: "#e2e8f0",
  chartColors: [
    "#4f46e5",
    "#7c3aed",
    "#0891b2",
    "#0d9488",
    "#059669",
    "#d97706",
  ],
  gridLineColor: "#f1f5f9",
  axisTickColor: "#94a3b8",
  tooltipBg: "#ffffff",
  tooltipBorderColor: "#e2e8f0",
  chart: cleanChart,
  preview: ["#4f46e5", "#7c3aed", "#0891b2"],
};

// PrimeReact Lara Light Blue
const primeReact: DashTheme = {
  id: "primereact",
  name: "PrimeReact",
  category: "design-system",
  pageBg: "#f9fafb",
  headerBg: "rgba(249,250,251,0.95)",
  headerBorderColor: "#dee2e6",
  cardBg: "#ffffff",
  cardBorderColor: "#dee2e6",
  dragHandleBg: "transparent",
  dragHandleBorderColor: "#e9ecef",
  titleColor: "#212529",
  mutedColor: "#6c757d",
  kpiValueColor: "#2196f3",
  tableHeaderBg: "#f8f9fa",
  tableHeaderText: "#6c757d",
  tableRowEvenBg: "#ffffff",
  tableRowOddBg: "#f8f9fa",
  tableText: "#495057",
  tableBorderColor: "#dee2e6",
  chartColors: [
    "#2196f3",
    "#4caf50",
    "#ff9800",
    "#e91e63",
    "#9c27b0",
    "#00bcd4",
  ],
  gridLineColor: "#e9ecef",
  axisTickColor: "#adb5bd",
  tooltipBg: "#ffffff",
  tooltipBorderColor: "#dee2e6",
  chart: softChart,
  preview: ["#2196f3", "#4caf50", "#ff9800"],
};

// Ant Design — blue/gray enterprise style
const antDesign: DashTheme = {
  id: "antd",
  name: "Ant Design",
  category: "design-system",
  pageBg: "#f0f2f5",
  headerBg: "rgba(255,255,255,0.95)",
  headerBorderColor: "#d9d9d9",
  cardBg: "#ffffff",
  cardBorderColor: "#d9d9d9",
  dragHandleBg: "transparent",
  dragHandleBorderColor: "#f0f0f0",
  titleColor: "#262626",
  mutedColor: "#8c8c8c",
  kpiValueColor: "#1677ff",
  tableHeaderBg: "#fafafa",
  tableHeaderText: "#8c8c8c",
  tableRowEvenBg: "#ffffff",
  tableRowOddBg: "#fafafa",
  tableText: "#262626",
  tableBorderColor: "#f0f0f0",
  chartColors: [
    "#1677ff",
    "#52c41a",
    "#fa8c16",
    "#722ed1",
    "#eb2f96",
    "#13c2c2",
  ],
  gridLineColor: "#f0f0f0",
  axisTickColor: "#bfbfbf",
  tooltipBg: "#ffffff",
  tooltipBorderColor: "#d9d9d9",
  chart: flatChart,
  preview: ["#1677ff", "#52c41a", "#fa8c16"],
};

// Chakra UI — teal/cyan, soft rounded
const chakraUI: DashTheme = {
  id: "chakra",
  name: "Chakra UI",
  category: "design-system",
  pageBg: "#f7fafc",
  headerBg: "rgba(247,250,252,0.95)",
  headerBorderColor: "#e2e8f0",
  cardBg: "#ffffff",
  cardBorderColor: "#e2e8f0",
  dragHandleBg: "transparent",
  dragHandleBorderColor: "#edf2f7",
  titleColor: "#1a202c",
  mutedColor: "#718096",
  kpiValueColor: "#319795",
  tableHeaderBg: "#f7fafc",
  tableHeaderText: "#718096",
  tableRowEvenBg: "#ffffff",
  tableRowOddBg: "#f7fafc",
  tableText: "#2d3748",
  tableBorderColor: "#e2e8f0",
  chartColors: [
    "#319795",
    "#3182ce",
    "#805ad5",
    "#d53f8c",
    "#dd6b20",
    "#38a169",
  ],
  gridLineColor: "#edf2f7",
  axisTickColor: "#a0aec0",
  tooltipBg: "#ffffff",
  tooltipBorderColor: "#e2e8f0",
  chart: softChart,
  preview: ["#319795", "#3182ce", "#805ad5"],
};

// Mantine — indigo/blue, modern
const mantine: DashTheme = {
  id: "mantine",
  name: "Mantine",
  category: "design-system",
  pageBg: "#f8f9fa",
  headerBg: "rgba(255,255,255,0.95)",
  headerBorderColor: "#dee2e6",
  cardBg: "#ffffff",
  cardBorderColor: "#dee2e6",
  dragHandleBg: "transparent",
  dragHandleBorderColor: "#f1f3f5",
  titleColor: "#212529",
  mutedColor: "#868e96",
  kpiValueColor: "#4263eb",
  tableHeaderBg: "#f8f9fa",
  tableHeaderText: "#868e96",
  tableRowEvenBg: "#ffffff",
  tableRowOddBg: "#f8f9fa",
  tableText: "#495057",
  tableBorderColor: "#dee2e6",
  chartColors: [
    "#4263eb",
    "#7c49c9",
    "#12b886",
    "#f76707",
    "#e03131",
    "#1c7ed6",
  ],
  gridLineColor: "#f1f3f5",
  axisTickColor: "#adb5bd",
  tooltipBg: "#ffffff",
  tooltipBorderColor: "#dee2e6",
  chart: {
    ...cleanChart,
    cardRadius: 8,
    lineArea: true,
    lineAreaOpacity: 0.12,
  },
  preview: ["#4263eb", "#7c49c9", "#12b886"],
};

// ─────────────────────────────────────────────────────────────────────────────
// ── COLOR / PALETTE THEMES ───────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

const zinc: DashTheme = {
  id: "zinc",
  name: "Zinc",
  category: "color",
  pageBg: "#fafafa",
  headerBg: "rgba(255,255,255,0.9)",
  headerBorderColor: "#e4e4e7",
  cardBg: "#ffffff",
  cardBorderColor: "#e4e4e7",
  dragHandleBg: "transparent",
  dragHandleBorderColor: "#f4f4f5",
  titleColor: "#18181b",
  mutedColor: "#a1a1aa",
  kpiValueColor: "#18181b",
  tableHeaderBg: "#fafafa",
  tableHeaderText: "#a1a1aa",
  tableRowEvenBg: "#ffffff",
  tableRowOddBg: "#fafafa",
  tableText: "#3f3f46",
  tableBorderColor: "#f4f4f5",
  chartColors: [
    "#18181b",
    "#52525b",
    "#71717a",
    "#a1a1aa",
    "#d4d4d8",
    "#3f3f46",
  ],
  gridLineColor: "#f4f4f5",
  axisTickColor: "#a1a1aa",
  tooltipBg: "#ffffff",
  tooltipBorderColor: "#e4e4e7",
  chart: cleanChart,
  preview: ["#18181b", "#52525b", "#a1a1aa"],
};

const dark: DashTheme = {
  id: "dark",
  name: "Dark",
  category: "color",
  pageBg: "#09090b",
  headerBg: "rgba(24,24,27,0.9)",
  headerBorderColor: "#27272a",
  cardBg: "#18181b",
  cardBorderColor: "#27272a",
  dragHandleBg: "transparent",
  dragHandleBorderColor: "#3f3f46",
  titleColor: "#f4f4f5",
  mutedColor: "#71717a",
  kpiValueColor: "#f4f4f5",
  tableHeaderBg: "#27272a",
  tableHeaderText: "#71717a",
  tableRowEvenBg: "#18181b",
  tableRowOddBg: "#1c1c1f",
  tableText: "#d4d4d8",
  tableBorderColor: "#3f3f46",
  chartColors: [
    "#a1a1aa",
    "#d4d4d8",
    "#e4e4e7",
    "#71717a",
    "#52525b",
    "#f4f4f5",
  ],
  gridLineColor: "#27272a",
  axisTickColor: "#52525b",
  tooltipBg: "#27272a",
  tooltipBorderColor: "#3f3f46",
  chart: cleanChart,
  preview: ["#09090b", "#18181b", "#a1a1aa"],
};

const ocean: DashTheme = {
  id: "ocean",
  name: "Ocean",
  category: "color",
  pageBg: "#f0f9ff",
  headerBg: "rgba(240,249,255,0.9)",
  headerBorderColor: "#bae6fd",
  cardBg: "#ffffff",
  cardBorderColor: "#bae6fd",
  dragHandleBg: "transparent",
  dragHandleBorderColor: "#e0f2fe",
  titleColor: "#0c4a6e",
  mutedColor: "#38bdf8",
  kpiValueColor: "#0369a1",
  tableHeaderBg: "#e0f2fe",
  tableHeaderText: "#0369a1",
  tableRowEvenBg: "#ffffff",
  tableRowOddBg: "#f0f9ff",
  tableText: "#0c4a6e",
  tableBorderColor: "#e0f2fe",
  chartColors: [
    "#0ea5e9",
    "#0284c7",
    "#38bdf8",
    "#7dd3fc",
    "#0369a1",
    "#bae6fd",
  ],
  gridLineColor: "#e0f2fe",
  axisTickColor: "#7dd3fc",
  tooltipBg: "#ffffff",
  tooltipBorderColor: "#bae6fd",
  chart: { ...softChart, lineArea: true, lineAreaOpacity: 0.15 },
  preview: ["#0ea5e9", "#38bdf8", "#0284c7"],
};

const rose: DashTheme = {
  id: "rose",
  name: "Rose",
  category: "color",
  pageBg: "#fff1f2",
  headerBg: "rgba(255,241,242,0.9)",
  headerBorderColor: "#fecdd3",
  cardBg: "#ffffff",
  cardBorderColor: "#fecdd3",
  dragHandleBg: "transparent",
  dragHandleBorderColor: "#fde8eb",
  titleColor: "#881337",
  mutedColor: "#fb7185",
  kpiValueColor: "#e11d48",
  tableHeaderBg: "#fff1f2",
  tableHeaderText: "#e11d48",
  tableRowEvenBg: "#ffffff",
  tableRowOddBg: "#fff1f2",
  tableText: "#881337",
  tableBorderColor: "#fecdd3",
  chartColors: [
    "#f43f5e",
    "#e11d48",
    "#fb7185",
    "#fda4af",
    "#be123c",
    "#fecdd3",
  ],
  gridLineColor: "#fecdd3",
  axisTickColor: "#fda4af",
  tooltipBg: "#ffffff",
  tooltipBorderColor: "#fecdd3",
  chart: softChart,
  preview: ["#f43f5e", "#fb7185", "#fda4af"],
};

const amber: DashTheme = {
  id: "amber",
  name: "Amber",
  category: "color",
  pageBg: "#fffbeb",
  headerBg: "rgba(255,251,235,0.9)",
  headerBorderColor: "#fde68a",
  cardBg: "#ffffff",
  cardBorderColor: "#fde68a",
  dragHandleBg: "transparent",
  dragHandleBorderColor: "#fef3c7",
  titleColor: "#78350f",
  mutedColor: "#f59e0b",
  kpiValueColor: "#b45309",
  tableHeaderBg: "#fffbeb",
  tableHeaderText: "#b45309",
  tableRowEvenBg: "#ffffff",
  tableRowOddBg: "#fffbeb",
  tableText: "#78350f",
  tableBorderColor: "#fde68a",
  chartColors: [
    "#f59e0b",
    "#d97706",
    "#fbbf24",
    "#fde68a",
    "#b45309",
    "#92400e",
  ],
  gridLineColor: "#fef3c7",
  axisTickColor: "#fbbf24",
  tooltipBg: "#ffffff",
  tooltipBorderColor: "#fde68a",
  chart: { ...cleanChart, barRadius: [6, 6, 0, 0] },
  preview: ["#f59e0b", "#fbbf24", "#fde68a"],
};

const violet: DashTheme = {
  id: "violet",
  name: "Violet",
  category: "color",
  pageBg: "#f5f3ff",
  headerBg: "rgba(245,243,255,0.9)",
  headerBorderColor: "#ddd6fe",
  cardBg: "#ffffff",
  cardBorderColor: "#ddd6fe",
  dragHandleBg: "transparent",
  dragHandleBorderColor: "#ede9fe",
  titleColor: "#2e1065",
  mutedColor: "#8b5cf6",
  kpiValueColor: "#6d28d9",
  tableHeaderBg: "#f5f3ff",
  tableHeaderText: "#6d28d9",
  tableRowEvenBg: "#ffffff",
  tableRowOddBg: "#f5f3ff",
  tableText: "#2e1065",
  tableBorderColor: "#ddd6fe",
  chartColors: [
    "#7c3aed",
    "#6d28d9",
    "#8b5cf6",
    "#a78bfa",
    "#5b21b6",
    "#c4b5fd",
  ],
  gridLineColor: "#ede9fe",
  axisTickColor: "#c4b5fd",
  tooltipBg: "#ffffff",
  tooltipBorderColor: "#ddd6fe",
  chart: softChart,
  preview: ["#7c3aed", "#8b5cf6", "#c4b5fd"],
};

const emerald: DashTheme = {
  id: "emerald",
  name: "Emerald",
  category: "color",
  pageBg: "#ecfdf5",
  headerBg: "rgba(236,253,245,0.9)",
  headerBorderColor: "#a7f3d0",
  cardBg: "#ffffff",
  cardBorderColor: "#a7f3d0",
  dragHandleBg: "transparent",
  dragHandleBorderColor: "#d1fae5",
  titleColor: "#064e3b",
  mutedColor: "#10b981",
  kpiValueColor: "#047857",
  tableHeaderBg: "#ecfdf5",
  tableHeaderText: "#047857",
  tableRowEvenBg: "#ffffff",
  tableRowOddBg: "#ecfdf5",
  tableText: "#064e3b",
  tableBorderColor: "#a7f3d0",
  chartColors: [
    "#10b981",
    "#059669",
    "#34d399",
    "#6ee7b7",
    "#047857",
    "#a7f3d0",
  ],
  gridLineColor: "#d1fae5",
  axisTickColor: "#6ee7b7",
  tooltipBg: "#ffffff",
  tooltipBorderColor: "#a7f3d0",
  chart: { ...cleanChart, lineArea: true, lineAreaOpacity: 0.12 },
  preview: ["#10b981", "#34d399", "#a7f3d0"],
};

// Retro / terminal-style
const retro: DashTheme = {
  id: "retro",
  name: "Retro",
  category: "color",
  pageBg: "#1a1a1a",
  headerBg: "rgba(26,26,26,0.97)",
  headerBorderColor: "#33ff33",
  cardBg: "#111111",
  cardBorderColor: "#2a2a2a",
  dragHandleBg: "transparent",
  dragHandleBorderColor: "#262626",
  titleColor: "#33ff33",
  mutedColor: "#22bb22",
  kpiValueColor: "#33ff33",
  tableHeaderBg: "#1a1a1a",
  tableHeaderText: "#22bb22",
  tableRowEvenBg: "#111111",
  tableRowOddBg: "#141414",
  tableText: "#33ff33",
  tableBorderColor: "#1f2b1f",
  chartColors: [
    "#33ff33",
    "#00ff88",
    "#ffff00",
    "#ff8800",
    "#ff4444",
    "#00ffff",
  ],
  gridLineColor: "#1f2b1f",
  axisTickColor: "#22bb22",
  tooltipBg: "#111111",
  tooltipBorderColor: "#33ff33",
  chart: stepChart,
  preview: ["#1a1a1a", "#33ff33", "#00ff88"],
};

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

/** All themes keyed by id */
export const THEMES: Record<string, DashTheme> = {
  // Design systems
  shadcn,
  "shadcn-dark": shadcnDark,
  material,
  "material-dark": materialDark,
  tailwind: tailwindUI,
  primereact: primeReact,
  antd: antDesign,
  chakra: chakraUI,
  mantine,
  // Color palettes
  zinc,
  dark,
  ocean,
  rose,
  amber,
  violet,
  emerald,
  retro,
};

export const THEME_LIST: DashTheme[] = Object.values(THEMES);

export const DESIGN_SYSTEM_THEMES = THEME_LIST.filter(
  (t) => t.category === "design-system",
);
export const COLOR_THEMES = THEME_LIST.filter((t) => t.category === "color");

export const DEFAULT_THEME_ID = "shadcn";

export function getTheme(id?: string | null): DashTheme {
  return THEMES[id ?? DEFAULT_THEME_ID] ?? THEMES[DEFAULT_THEME_ID];
}
