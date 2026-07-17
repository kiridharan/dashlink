import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AggregationMetric,
  DashWidget,
  GridItem,
  FilterControl,
} from "@/lib/dashlink/builder-types";

export const maxDuration = 60;

// ---- Request/response shapes exchanged with the AI panel ----

interface FieldSummary {
  name: string;
  kind: "numeric" | "date" | "categorical";
  samples: string[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ExistingWidget {
  id: string;
  type: string;
  description: string;
}

const VALID_SPANS = new Set([3, 4, 6, 12]);
const METRICS = new Set(["sum", "avg", "min", "max", "count", "countDistinct"]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// ---- Function-calling tool the model uses to emit the final dashboard ----

const DASHBOARD_TOOL: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: {
    name: "generate_dashboard",
    description:
      "Emit the final dashboard specification. Call this exactly once, only after you have enough information (at most two clarifying questions). Every field name you reference MUST be one of the dataset fields you were given.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Short dashboard title" },
        mode: {
          type: "string",
          enum: ["replace", "add"],
          description:
            "'replace' wipes the current canvas and builds fresh; 'add' appends the widgets in this call to the existing dashboard. Always 'replace' when the canvas is empty.",
        },
        widgets: {
          type: "array",
          description:
            "Widgets in display order. KPIs first (span 3, height 120), then charts (span 6, height 280), then optionally one table (span 12, height 320).",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["kpi", "line", "bar", "pie", "table"],
              },
              label: { type: "string" },
              metric: {
                type: "string",
                enum: ["sum", "avg", "min", "max", "count", "countDistinct"],
              },
              field: { type: "string", description: "kpi only: numeric field" },
              x: {
                type: "string",
                description: "line/bar: x-axis field (date field for line)",
              },
              y: { type: "string", description: "line/bar: numeric y field" },
              category: {
                type: "string",
                description: "pie only: categorical field",
              },
              value: { type: "string", description: "pie only: numeric field" },
              columns: {
                type: "array",
                items: { type: "string" },
                description: "table only: columns to show",
              },
              span: { type: "integer", enum: [3, 4, 6, 12] },
              height: { type: "integer", minimum: 100, maximum: 700 },
            },
            required: ["type", "span", "height"],
          },
        },
        filters: {
          type: "array",
          description:
            "Optional viewer filter controls (e.g. dateRange on the order date, select on a category field).",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: [
                  "select",
                  "multiSelect",
                  "dateRange",
                  "numberRange",
                  "search",
                ],
              },
              field: { type: "string" },
              label: { type: "string" },
            },
            required: ["type"],
          },
        },
      },
      required: ["name", "widgets", "mode"],
    },
  },
};

// ---- Tool for editing/removing widgets already on the canvas ----

const MODIFY_TOOL: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: {
    name: "modify_dashboard",
    description:
      "Edit or remove widgets that are already on the canvas, referenced by their widget id. IMPORTANT: before removing anything you MUST have asked the user to confirm the removal in a previous message and received a clear yes. Edits do not need confirmation.",
    parameters: {
      type: "object",
      properties: {
        remove: {
          type: "array",
          items: { type: "string" },
          description:
            "Ids of widgets to delete. Only include after the user explicitly confirmed the removal.",
        },
        edits: {
          type: "array",
          description: "Changes to individual existing widgets.",
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "Id of the widget to edit" },
              label: { type: "string" },
              metric: {
                type: "string",
                enum: ["sum", "avg", "min", "max", "count", "countDistinct"],
              },
              field: { type: "string", description: "kpi only" },
              x: { type: "string", description: "line/bar only" },
              y: { type: "string", description: "line/bar only" },
              category: { type: "string", description: "pie only" },
              value: { type: "string", description: "pie only" },
              columns: {
                type: "array",
                items: { type: "string" },
                description: "table only",
              },
              span: { type: "integer", enum: [3, 4, 6, 12] },
              height: { type: "integer", minimum: 100, maximum: 700 },
            },
            required: ["id"],
          },
        },
      },
    },
  },
};

function buildSystemPrompt(
  fields: FieldSummary[],
  rowCount: number,
  existingWidgets: ExistingWidget[],
): string {
  const fieldLines = fields
    .map(
      (f) =>
        `- ${f.name} (${f.kind})${f.samples.length ? ` e.g. ${f.samples.slice(0, 3).join(", ")}` : ""}`,
    )
    .join("\n");

  return `You are the AI dashboard designer inside DashLink, a drag-and-drop dashboard builder. The user has already connected a data source; you design a dashboard over it.

Dataset: ${rowCount} rows with these fields:
${fieldLines}

${
  existingWidgets.length > 0
    ? `The canvas already has ${existingWidgets.length} widgets (id — description):
${existingWidgets.map((w) => `- ${w.id} — ${w.description}`).join("\n")}

Choosing the right tool:
- If the user clearly wants additions ("add", "also show", "include", "append", "one more"), call generate_dashboard with mode "add" and emit ONLY the new widgets — do not repeat existing ones.
- If they clearly want to start over ("replace", "rebuild", "start over", "new dashboard", "instead"), call generate_dashboard with mode "replace" and a complete dashboard.
- If they want to change an existing widget ("rename", "make X a bar chart's average", "resize", "change the field"), call modify_dashboard with an edit for that widget id. To change a widget's TYPE (e.g. bar → pie), instead remove it and add the replacement via generate_dashboard mode "add".
- If they want to delete widgets ("remove", "delete", "get rid of"), FIRST reply with a short plain-text confirmation question naming exactly what will be removed (e.g. "Remove the 'Revenue' KPI and the orders table — are you sure?"). Only after the user answers yes, call modify_dashboard with those ids in "remove". This confirmation does NOT count toward your clarifying-question limit. Never remove without a confirmed yes.
- If the intent between add and replace is ambiguous, ask (this counts as one of your clarifying questions).`
    : `The canvas is currently empty, so always use mode "replace".`
}

Rules:
- You may ask AT MOST two short clarifying questions total across the conversation (one at a time), and only if the user's goal is genuinely ambiguous. If the intent is reasonably clear, skip questions and generate immediately.
- When ready, call the generate_dashboard tool exactly once with the complete spec. Do not describe the dashboard in prose instead of calling the tool.
- Only reference field names from the list above, exactly as spelled.
- kpi widgets need a numeric "field"; line charts want a date field on "x" and numeric "y"; bar charts a categorical "x" and numeric "y"; pie a categorical "category" and numeric "value".
- A good dashboard: 3-4 KPIs, 2-4 charts, one table, and 1-3 sensible viewer filters.`;
}

// ---- Sanitize the model's spec into real DashWidget/GridItem/FilterControl values ----

function sanitizeSpec(
  input: Record<string, unknown>,
  fields: FieldSummary[],
): {
  name: string;
  mode: "replace" | "add";
  widgets: DashWidget[];
  layout: GridItem[];
  filters: FilterControl[];
} | null {
  const fieldNames = new Set(fields.map((f) => f.name));
  const validField = (v: unknown): v is string =>
    typeof v === "string" && fieldNames.has(v);

  const widgets: DashWidget[] = [];
  const layout: GridItem[] = [];
  const rawWidgets = Array.isArray(input.widgets) ? input.widgets : [];

  rawWidgets.forEach((raw, idx) => {
    if (!isObject(raw)) return;
    const id = `ai-${Date.now().toString(36)}-${idx}`;
    const label = typeof raw.label === "string" ? raw.label : "Untitled";
    const metric =
      typeof raw.metric === "string" && METRICS.has(raw.metric)
        ? (raw.metric as AggregationMetric)
        : "sum";

    let widget: DashWidget | null = null;
    switch (raw.type) {
      case "kpi":
        if (validField(raw.field))
          widget = { id, type: "kpi", field: raw.field, label, metric };
        break;
      case "line":
        if (validField(raw.x) && validField(raw.y))
          widget = { id, type: "line", x: raw.x, y: raw.y, label, metric };
        break;
      case "bar":
        if (validField(raw.x) && validField(raw.y))
          widget = { id, type: "bar", x: raw.x, y: raw.y, label, metric };
        break;
      case "pie":
        if (validField(raw.category) && validField(raw.value))
          widget = {
            id,
            type: "pie",
            category: raw.category,
            value: raw.value,
            label,
            metric,
          };
        break;
      case "table": {
        const columns = Array.isArray(raw.columns)
          ? raw.columns.filter(validField)
          : undefined;
        widget = {
          id,
          type: "table",
          columns: columns?.length ? columns : undefined,
        };
        break;
      }
    }
    if (!widget) return;

    const span =
      typeof raw.span === "number" && VALID_SPANS.has(raw.span)
        ? raw.span
        : widget.type === "kpi"
          ? 3
          : widget.type === "table"
            ? 12
            : 6;
    const height =
      typeof raw.height === "number"
        ? Math.min(700, Math.max(100, Math.round(raw.height)))
        : widget.type === "kpi"
          ? 120
          : widget.type === "table"
            ? 320
            : 280;

    widgets.push(widget);
    layout.push({ i: id, span, height });
  });

  if (widgets.length === 0) return null;

  const filters: FilterControl[] = [];
  const rawFilters = Array.isArray(input.filters) ? input.filters : [];
  rawFilters.forEach((raw, idx) => {
    if (!isObject(raw)) return;
    const id = `ai-filter-${Date.now().toString(36)}-${idx}`;
    const label = typeof raw.label === "string" ? raw.label : "";
    if (raw.type === "search") {
      filters.push({ id, type: "search", label });
    } else if (
      (raw.type === "select" ||
        raw.type === "multiSelect" ||
        raw.type === "dateRange" ||
        raw.type === "numberRange") &&
      validField(raw.field)
    ) {
      filters.push({
        id,
        type: raw.type,
        field: raw.field,
        label,
      } as FilterControl);
    }
  });

  return {
    name: typeof input.name === "string" ? input.name : "AI Dashboard",
    mode: input.mode === "add" ? "add" : "replace",
    widgets,
    layout,
    filters,
  };
}

// ---- Sanitize a modify_dashboard call against the real canvas widgets ----

function sanitizeModification(
  input: Record<string, unknown>,
  fields: FieldSummary[],
  existing: ExistingWidget[],
): {
  remove: string[];
  edits: {
    id: string;
    patch: Record<string, unknown>;
    layoutPatch?: { span?: number; height?: number };
  }[];
} | null {
  const fieldNames = new Set(fields.map((f) => f.name));
  const validField = (v: unknown): v is string =>
    typeof v === "string" && fieldNames.has(v);
  const byId = new Map(existing.map((w) => [w.id, w]));

  const remove = (Array.isArray(input.remove) ? input.remove : []).filter(
    (id): id is string => typeof id === "string" && byId.has(id),
  );

  const edits: {
    id: string;
    patch: Record<string, unknown>;
    layoutPatch?: { span?: number; height?: number };
  }[] = [];

  (Array.isArray(input.edits) ? input.edits : []).forEach((raw) => {
    if (!isObject(raw) || typeof raw.id !== "string") return;
    const target = byId.get(raw.id);
    if (!target) return;

    const patch: Record<string, unknown> = {};
    if (typeof raw.label === "string") patch.label = raw.label;
    if (typeof raw.metric === "string" && METRICS.has(raw.metric))
      patch.metric = raw.metric;

    // Only accept data-binding fields that make sense for the widget's type.
    if (target.type === "kpi" && validField(raw.field)) patch.field = raw.field;
    if (target.type === "line" || target.type === "bar") {
      if (validField(raw.x)) patch.x = raw.x;
      if (validField(raw.y)) patch.y = raw.y;
    }
    if (target.type === "pie") {
      if (validField(raw.category)) patch.category = raw.category;
      if (validField(raw.value)) patch.value = raw.value;
    }
    if (target.type === "table" && Array.isArray(raw.columns)) {
      const columns = raw.columns.filter(validField);
      if (columns.length) patch.columns = columns;
    }

    const layoutPatch: { span?: number; height?: number } = {};
    if (typeof raw.span === "number" && VALID_SPANS.has(raw.span))
      layoutPatch.span = raw.span;
    if (typeof raw.height === "number")
      layoutPatch.height = Math.min(700, Math.max(100, Math.round(raw.height)));

    const hasLayout = Object.keys(layoutPatch).length > 0;
    if (Object.keys(patch).length === 0 && !hasLayout) return;
    edits.push({
      id: raw.id,
      patch,
      layoutPatch: hasLayout ? layoutPatch : undefined,
    });
  });

  if (remove.length === 0 && edits.length === 0) return null;
  return { remove, edits };
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.AI_GATEWAY_API_KEY ?? process.env.OPENAI_API_KEY;
  const baseURL = process.env.AI_GATEWAY_BASE_URL;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI is not configured. Set AI_GATEWAY_API_KEY on the server." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (
    !isObject(body) ||
    !Array.isArray(body.messages) ||
    !Array.isArray(body.fields)
  ) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const fields = (body.fields as FieldSummary[]).filter(
    (f) => isObject(f) && typeof f.name === "string",
  );
  const rowCount = typeof body.rowCount === "number" ? body.rowCount : 0;
  const existingWidgets: ExistingWidget[] = Array.isArray(body.existingWidgets)
    ? body.existingWidgets
        .filter(
          (w): w is ExistingWidget =>
            isObject(w) &&
            typeof w.id === "string" &&
            typeof w.type === "string" &&
            typeof w.description === "string",
        )
        .slice(0, 40)
    : [];
  const messages = (body.messages as ChatMessage[])
    .filter(
      (m) =>
        isObject(m) &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .slice(-12);

  if (fields.length === 0 || messages.length === 0) {
    return NextResponse.json(
      { error: "Dataset fields and at least one message are required." },
      { status: 400 },
    );
  }

  const client = new OpenAI({ apiKey, baseURL });

  try {
    const rawResponse = await client.chat.completions.create({
      model: process.env.AI_DASHBOARD_MODEL ?? "claude-sonnet-4-6",
      max_tokens: 4096,
      tools:
        existingWidgets.length > 0
          ? [DASHBOARD_TOOL, MODIFY_TOOL]
          : [DASHBOARD_TOOL],
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(fields, rowCount, existingWidgets),
        },
        ...messages,
      ],
    });
;
    // GateLLM returns the completion double-encoded (a JSON string body), so
    // the SDK may hand back a string instead of a parsed object. Normalize.
    const response: OpenAI.Chat.Completions.ChatCompletion =
      typeof rawResponse === "string" ? JSON.parse(rawResponse) : rawResponse;

    if (!Array.isArray(response.choices) || response.choices.length === 0) {
      console.error(
        "AI gateway returned an unexpected body:",
        JSON.stringify(response).slice(0, 2000),
      );
      return NextResponse.json(
        { error: "AI gateway returned an unexpected response — check server logs." },
        { status: 502 },
      );
    }

    console.log("AI response:", JSON.stringify(response, null, 2))

    const choice = response.choices[0];
    const modifyCall = choice?.message.tool_calls?.find(
      (t) => t.type === "function" && t.function.name === "modify_dashboard",
    );
    if (modifyCall && modifyCall.type === "function") {
      let parsed: unknown;
      try {
        parsed = JSON.parse(modifyCall.function.arguments);
      } catch {
        parsed = null;
      }
      const mod = isObject(parsed)
        ? sanitizeModification(parsed, fields, existingWidgets)
        : null;
      if (mod) {
        return NextResponse.json({ type: "modify", ...mod });
      }
      return NextResponse.json({
        type: "message",
        text: "I couldn't match that to any widget on the canvas — could you say which widget you mean?",
      });
    }

    const toolCall = choice?.message.tool_calls?.find(
      (t) => t.type === "function" && t.function.name === "generate_dashboard",
    );

    if (toolCall && toolCall.type === "function") {
      let parsed: unknown;
      try {
        parsed = JSON.parse(toolCall.function.arguments);
      } catch {
        parsed = null;
      }
      const spec = isObject(parsed) ? sanitizeSpec(parsed, fields) : null;
      if (spec) {
        return NextResponse.json({ type: "dashboard", ...spec });
      }
      return NextResponse.json({
        type: "message",
        text: "I couldn't map that to valid widgets for this dataset — could you rephrase what you'd like to see?",
      });
    }

    const text = choice?.message.content?.trim();
    return NextResponse.json({
      type: "message",
      text: text || "Could you tell me a bit more about the dashboard you want?",
    });
  } catch (error) {
    if (error instanceof OpenAI.RateLimitError) {
      return NextResponse.json(
        { error: "AI is rate-limited right now — try again in a moment." },
        { status: 429 },
      );
    }
    if (error instanceof OpenAI.APIError) {
      console.error("AI gateway error:", error.status, error.message);
      return NextResponse.json(
        {
          error: `AI request failed (${error.status ?? "network"}): ${error.message}`,
        },
        { status: 502 },
      );
    }
    throw error;
  }
}
