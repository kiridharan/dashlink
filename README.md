# DashLink

**Paste a URL. Get a dashboard.**

DashLink is an open-source, no-code dashboard builder. Point it at any public JSON API endpoint and it automatically detects the data schema, generates visualizations, and gives you a fully drag-and-drop editable dashboard — shareable via a permanent link.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development Server](#development-server)
  - [Production Build](#production-build)
- [Project Structure](#project-structure)
- [Application Guide](#application-guide)
  - [Creating a Dashboard](#creating-a-dashboard)
  - [Builder Interface](#builder-interface)
  - [Widget Types](#widget-types)
  - [Theme System](#theme-system)
  - [Sharing](#sharing)
- [API Reference](#api-reference)
  - [Data Proxy](#data-proxy)
- [Architecture](#architecture)
  - [State Management](#state-management)
  - [Schema Detection](#schema-detection)
  - [Grid System](#grid-system)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Zero-config visualizations** — paste any JSON API URL and charts are generated automatically based on the detected data shape
- **Drag-and-drop builder** — reorder and resize widgets on a 12-column responsive grid
- **5 widget types** — KPI cards, line charts, bar charts, pie charts, and data tables
- **17 themes** — design-system-inspired (shadcn, Material, Tailwind UI, PrimeReact, Ant Design, Chakra UI, Mantine) and color palettes
- **Per-theme chart style** — each theme ships its own bar radius, line curve, area fill, grid style, card shadow, and tooltip shape
- **Shareable links** — every dashboard gets a permanent public URL you can send to anyone
- **Authenticated header** — SSRF-protected server-side data proxy with support for Bearer, API key, and Basic auth
- **Offline-first** — all project data is stored locally via Zustand + `localStorage`; no server required to use

---

## Tech Stack

| Layer           | Library / Version                      |
| --------------- | -------------------------------------- |
| Framework       | Next.js 15 (App Router)                |
| UI Library      | React 19                               |
| Language        | TypeScript 5                           |
| Styling         | Tailwind CSS 4                         |
| Charts          | Recharts 3                             |
| Drag-and-drop   | @dnd-kit/core 6 + @dnd-kit/sortable 10 |
| Resize          | re-resizable 6                         |
| State           | Zustand 5 (with `persist` middleware)  |
| Font            | Geist (Vercel)                         |
| Package manager | pnpm                                   |
| Linting         | ESLint 9                               |

---

## Getting Started

### Prerequisites

- **Node.js** 18.17 or later
- **pnpm** 9 or later

```bash
npm install -g pnpm
```

### Installation

```bash
git clone https://github.com/your-org/dashlink.git
cd dashlink
pnpm install
```

### Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The app hot-reloads on every save.

### Production Build

```bash
pnpm build
pnpm start
```

To export a static site:

```bash
pnpm build
# output is in .next/
```

---

## Project Structure

```
dashlink/
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # Landing page
│   ├── layout.tsx              # Root layout (font, providers)
│   ├── login/page.tsx          # Login
│   ├── signup/page.tsx         # Sign up
│   ├── dashboard/page.tsx      # Project list
│   ├── projects/[id]/page.tsx  # Dashboard builder
│   ├── view/[id]/page.tsx      # Public viewer
│   └── api/
│       ├── proxy/                   # Data proxy endpoint
│
├── components/
│   ├── auth/                   # AuthCard (login/signup form)
│   ├── builder/                # Builder UI
│   │   ├── BuilderLayout.tsx   # Top-level editor shell
│   │   ├── GridCanvas.tsx      # Drag-and-drop grid
│   │   ├── WidgetPalette.tsx   # Sidebar widget picker
│   │   ├── ThemeSelector.tsx   # Theme switcher dropdown
│   │   └── widgets/            # Individual widget renderers
│   │       ├── BarWidgetChart.tsx
│   │       ├── KpiWidgetCard.tsx
│   │       ├── LineWidgetChart.tsx
│   │       ├── PieWidgetChart.tsx
│   │       └── TableWidgetView.tsx
│   ├── dashlink/               # Viewer-side components
│   │   ├── DashboardRenderer.tsx
│   │   ├── DashboardView.tsx
│   │   ├── UrlInputForm.tsx
│   │   ├── KpiCard.tsx
│   │   ├── DashBarChart.tsx
│   │   ├── DashLineChart.tsx
│   │   └── DataTable.tsx
│   ├── dashboard/              # Project list cards
│   ├── projects/               # ProjectCard
│   └── view/                   # ProjectView (viewer shell)
│
├── lib/
│   ├── dashlink/
│   │   ├── types.ts            # Shared data types (Dataset, DataRow…)
│   │   ├── builder-types.ts    # Widget and GridItem types
│   │   ├── themes.ts           # Theme definitions + ChartStyle
│   │   ├── theme-context.tsx   # ThemeProvider + useWidgetTheme()
│   │   ├── actions.ts          # generateDashboard() orchestrator
│   │   ├── schema-detection.ts # Auto-detect chart types from data
│   │   └── utils.ts
│   ├── store/
│   │   ├── auth-store.ts       # Zustand auth store
│   │   ├── project-store.ts    # Zustand project store
│   │   └── provider.tsx        # Store hydration wrapper
│
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Application Guide

### Creating a Dashboard

1. **Sign up** at `/signup` or **log in** at `/login`.
2. From the **Dashboard** page (`/dashboard`), click **Create new dashboard**.
3. In the wizard:
   - Give the dashboard a name.
   - Paste the URL of any public JSON API (e.g. `https://api.example.com/sales`).
   - Optionally add auth: Bearer token, API key, or Basic credentials.
   - Optionally specify a **data path** to drill into nested JSON (e.g. `data.results`).
4. Click **Generate** — DashLink fetches the data, detects its schema, and creates an initial set of widgets automatically.

**Example public APIs that work out of the box:**

```
https://jsonplaceholder.typicode.com/posts
https://jsonplaceholder.typicode.com/todos
https://api.coindesk.com/v1/bpi/currentprice.json
```

---

### Builder Interface

The builder at `/projects/[id]` has three zones:

| Zone             | What it does                                                                  |
| ---------------- | ----------------------------------------------------------------------------- |
| **Header bar**   | Rename the dashboard, copy the share link, switch theme, refresh data         |
| **Left sidebar** | Add new widgets (drag from sidebar or click to add), configure field mappings |
| **Canvas**       | The grid — drag tiles to reorder, drag bottom edge to resize height           |

Each widget tile has a **drag handle** (top bar), a **gear icon** to configure which fields to plot, and an **× button** to remove it. The height label in the header shows the current pixel height and updates live as you resize.

---

### Widget Types

| Widget         | Icon | Best for                                        | Config           |
| -------------- | ---- | ----------------------------------------------- | ---------------- |
| **KPI Card**   | 🔢   | Single summary metric (sum of a numeric column) | Field selector   |
| **Line Chart** | 📈   | Trends over time or ordered categories          | X axis + Y axis  |
| **Bar Chart**  | 📊   | Comparisons across categories                   | X axis + Y axis  |
| **Pie Chart**  | 🥧   | Part-to-whole relationships                     | Category + Value |
| **Table**      | 🗂   | Raw data exploration, all columns               | No config needed |

Default widget sizes are assigned automatically based on type (KPI = 3 cols, chart = 6 cols, table = 12 cols) and can be changed by resizing on the canvas.

---

### Theme System

DashLink ships **17 themes** in two categories, selectable from the theme button in the builder header.

#### Design System Themes

These replicate the visual language of popular component libraries:

| ID              | Inspired by            | Chart style                         |
| --------------- | ---------------------- | ----------------------------------- |
| `shadcn`        | shadcn/ui              | Clean, flat bars, plain line        |
| `shadcn-dark`   | shadcn/ui dark         | Same, dark background               |
| `material`      | Material Design 3      | Dots + area fill, elevation shadows |
| `material-dark` | Material Design 3 dark | Same, dark background               |
| `tailwind`      | Tailwind UI            | Rounded bars, clean grid            |
| `primereact`    | PrimeReact             | Soft natural curves, no grid        |
| `antd`          | Ant Design             | Flat square bars, dashed grid       |
| `chakra`        | Chakra UI              | Soft teal palette, natural curves   |
| `mantine`       | Mantine                | Indigo-centric, rounded bars        |

#### Color Palette Themes

| ID        | Palette                 |
| --------- | ----------------------- |
| `zinc`    | Zinc / neutral grays    |
| `dark`    | Pure dark mode          |
| `ocean`   | Deep blues + cyans      |
| `rose`    | Pinks + reds            |
| `amber`   | Warm amber + gold       |
| `violet`  | Purple + indigo         |
| `emerald` | Greens + teals          |
| `retro`   | Terminal green on black |

Each theme manages its own `ChartStyle` configuration, controlling: bar corner radius, bar width, line curve type (`monotone` / `linear` / `step` / `natural`), area fill opacity, grid visibility, grid dash pattern, card border radius, card shadow, tooltip corner radius, and axis label size.

**Adding a custom theme** — edit [`lib/dashlink/themes.ts`](lib/dashlink/themes.ts), add a new `DashTheme` object following the existing pattern, and add it to the `THEMES` record and the appropriate list export (`DESIGN_SYSTEM_THEMES` or `COLOR_THEMES`).

---

### Sharing

Every dashboard has a unique URL of the form `/view/[id]`. Copy it from the **Share** button in the builder header. The viewer page is fully public — no login required.

The viewer renders the saved widget configuration on top of freshly fetched live data, so recipients always see up-to-date numbers.

---

## API Reference

### Data Proxy

All external data requests are routed through a server-side proxy to protect against CORS issues and to keep API credentials out of the browser.

```
POST /api/data/proxy
Content-Type: application/json
```

**Request body:**

```json
{
  "url": "https://api.example.com/endpoint",
  "auth": {
    "type": "bearer",
    "token": "sk-..."
  }
}
```

`auth.type` options:

| Value       | Extra fields                    |
| ----------- | ------------------------------- |
| `"none"`    | —                               |
| `"bearer"`  | `token`                         |
| `"api-key"` | `header` (header name), `token` |
| `"basic"`   | `username`, `password`          |

**Security:** In production, the proxy blocks requests to private IP ranges (RFC 1918) and loopback addresses to prevent SSRF attacks. Requests time out after 15 seconds.

---

## Architecture

### State Management

All application state lives client-side in two Zustand stores, both persisted to `localStorage`:

**`auth-store`** — current user session (`{ id, name, email }`). Login/signup write here; the middleware persists it across page refreshes.

**`project-store`** — the full project graph:

```ts
interface Project {
  id: string;
  name: string;
  apiUrl: string;
  authConfig: AuthConfig;
  dataPath?: string;
  config: DashboardConfig; // auto-detected chart config
  widgets: DashWidget[]; // current widget instances
  layout: GridItem[]; // grid positions & heights
  data: Dataset; // last-fetched rows
  theme: string; // theme ID
}
```

No backend persistence exists in the current version. Cloud sync via Supabase is on the roadmap.

---

### Schema Detection

`lib/dashlink/schema-detection.ts` inspects the first row of the dataset and applies these rules:

1. If a field name looks like a date/time → candidate for X axis
2. All numeric fields are KPI candidates (up to 4 KPI widgets)
3. Non-numeric × numeric pairs generate bar or line charts depending on whether the X axis is date-like
4. One catch-all table widget is always added
5. Pie charts are suggested when there is exactly one categorical + one numeric field

The detection is intentionally conservative — it generates a usable starting layout, not a final one. Users are expected to reconfigure fields in the builder.

---

### Grid System

The canvas uses a **12-column CSS grid**. Each widget occupies a `span` of 3, 4, 6, or 12 columns. Heights are expressed in pixels (default 220 px for charts, 140 px for KPI cards) and stored per widget in `GridItem.height`.

Drag-and-drop is provided by `@dnd-kit` using the `rectSortingStrategy`. Widget order in the array is the source of truth; the grid reflows automatically. Resize is pixel-accurate via `re-resizable` with a 6-pixel bottom drag handle.

---

## Roadmap

- [ ] **Supabase persistence** — save projects and share links server-side
- [ ] **Supabase Auth** — replace the local session with real authentication
- [ ] **AI dashboard generation** — describe your data in natural language to get a starting layout (scaffold in `app/api/ai/generate-dashboard/`)
- [ ] **MCP data connector** — connect dashboards to MCP tool servers (scaffold in `lib/mcp/`)
- [ ] **Multi-series charts** — plot multiple Y columns on a single chart
- [ ] **Custom color overrides** — per-widget color picker on top of the theme
- [ ] **Export to PNG/PDF** — one-click dashboard screenshot
- [ ] **Scheduled refresh** — auto-refresh data on a configurable interval
- [ ] **Filters & date range picker** — interactive dashboard controls
- [ ] **Embed snippet** — `<iframe>` code to embed a dashboard in any page

---

## Contributing

Contributions are welcome. Here is the recommended workflow:

1. **Fork** the repository and create a branch: `git checkout -b feat/my-feature`
2. **Install** dependencies: `pnpm install`
3. **Run** the dev server: `pnpm dev`
4. Make your changes. Keep commits focused on a single logical change.
5. **Type-check** before pushing: `pnpm tsc --noEmit`
6. **Lint**: `pnpm lint`
7. Open a **Pull Request** with a clear description of what was changed and why.

### Adding a Widget Type

1. Add the new type to the discriminated union in [`lib/dashlink/builder-types.ts`](lib/dashlink/builder-types.ts)
2. Create the component in [`components/builder/widgets/`](components/builder/widgets/)
3. Register it in the `WidgetContent` switch in [`components/builder/GridCanvas.tsx`](components/builder/GridCanvas.tsx)
4. Add a detection rule in [`lib/dashlink/schema-detection.ts`](lib/dashlink/schema-detection.ts)

### Adding a Theme

1. Open [`lib/dashlink/themes.ts`](lib/dashlink/themes.ts)
2. Create a `ChartStyle` preset (or reuse an existing one)
3. Define the `DashTheme` object with all required tokens
4. Add it to `THEMES`, `THEME_LIST`, and either `DESIGN_SYSTEM_THEMES` or `COLOR_THEMES`

---

## License

MIT © DashLink Contributors

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
