"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import type { AuthConfig, AuthType, Dataset } from "@/lib/dashlink/types";
import type { DashWidget, GridItem } from "@/lib/dashlink/builder-types";
import { formatLabel } from "@/lib/dashlink/utils";
import {
  findArrayPathsDeep,
  flattenJsonToDataset,
  flattenObject,
} from "@/lib/dashlink/flatten";

// ---------------------------------------------------------------------------
// JSON helpers
// ---------------------------------------------------------------------------

function resolvePath(data: unknown, path: string): unknown {
  if (!path) return data;
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc !== null && typeof acc === "object" && !Array.isArray(acc)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, data);
}

// Deep nested-JSON aware flattening.
// Accepts arbitrary objects (not just arrays) and turns nested keys into dot paths.
function toDataset(input: unknown): Dataset {
  return flattenJsonToDataset(input).slice(0, 500);
}

function findArrayPaths(
  obj: unknown,
): Array<{ path: string; length: number; sample: string }> {
  return findArrayPathsDeep(obj);
}

function detectGoogleSheetCsvUrl(url: string): string {
  if (!url.includes("docs.google.com/spreadsheets")) return url;
  const idMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!idMatch?.[1]) return url;
  const parsed = new URL(url);
  const gid = parsed.searchParams.get("gid");
  return `https://docs.google.com/spreadsheets/d/${idMatch[1]}/export?format=csv${gid ? `&gid=${gid}` : ""}`;
}

function parseCsvLine(line: string): string[] {
  const cols: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      cols.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cols.push(current.trim());
  return cols;
}

function parseCsv(text: string): Dataset {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return [];
  const headers = parseCsvLine(lines[0]);
  if (!headers.length) return [];
  return lines.slice(1, 501).map((line) => {
    const cols = parseCsvLine(line);
    const row: Record<string, string | number | boolean | null> = {};
    headers.forEach((header, idx) => {
      const value = cols[idx] ?? "";
      if (value === "") {
        row[header] = null;
      } else if (!isNaN(Number(value))) {
        row[header] = Number(value);
      } else if (
        value.toLowerCase() === "true" ||
        value.toLowerCase() === "false"
      ) {
        row[header] = value.toLowerCase() === "true";
      } else {
        row[header] = value;
      }
    });
    return row;
  });
}

function parseTextData(text: string): Dataset {
  try {
    const json = JSON.parse(text);
    return toDataset(json);
  } catch {
    return parseCsv(text);
  }
}

function parseExcelData(buffer: ArrayBuffer): Dataset {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    workbook.Sheets[firstSheetName],
    {
      raw: true,
      defval: null,
    },
  );
  return toDataset(rows);
}

// ---------------------------------------------------------------------------
// Field inference
// ---------------------------------------------------------------------------

type FieldKind = "numeric" | "date" | "categorical" | "text";

function inferKind(samples: unknown[]): FieldKind {
  const s = samples.filter((v) => v !== null && v !== undefined && v !== "");
  if (!s.length) return "text";
  if (
    s.every(
      (v) =>
        typeof v === "number" ||
        (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v))),
    )
  )
    return "numeric";
  if (s.every((v) => typeof v === "string" && /^\d{4}[-/]/.test(v as string)))
    return "date";
  const uniq = new Set(s);
  if (uniq.size <= Math.max(10, Math.floor(s.length * 0.3)))
    return "categorical";
  return "text";
}

interface FieldInfo {
  name: string;
  kind: FieldKind;
}

function detectFields(data: Dataset): FieldInfo[] {
  if (!data.length) return [];
  return Object.keys(data[0]).map((name) => ({
    name,
    kind: inferKind(data.slice(0, 20).map((r) => r[name])),
  }));
}

const KIND_BADGE: Record<FieldKind, { label: string; cls: string }> = {
  numeric: {
    label: "123",
    cls: "bg-indigo-50 text-indigo-700 border-indigo-100",
  },
  date: {
    label: "Date",
    cls: "bg-zinc-50 text-zinc-600 border-zinc-200",
  },
  categorical: {
    label: "ABC",
    cls: "bg-zinc-50 text-zinc-600 border-zinc-200",
  },
  text: { label: "Txt", cls: "bg-zinc-100 text-zinc-500 border-zinc-200" },
};

// ---------------------------------------------------------------------------
// Widget entry (temporary build list in step 3)
// ---------------------------------------------------------------------------

type WEntry = {
  id: string;
  type: "kpi" | "line" | "bar" | "pie";
  label: string;
  /** [primaryField] for kpi, [xField, yField] for line/bar, [category, value] for pie */
  fields: [string, string] | [string];
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  onClose?: () => void;
  onCreated?: (id: string) => void;
  mode?: "modal" | "page";
}

type Step = 1 | 2 | 3;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CreateProjectWizard({
  onClose,
  onCreated,
  mode = "modal",
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  // -- Step 1 state --
  const [name, setName] = useState("Untitled Dashboard");
  const [sourceType, setSourceType] = useState<"api" | "excel" | "gsheet">(
    "api",
  );
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [apiUrl, setApiUrl] = useState("");
  const [authType, setAuthType] = useState<AuthType>("none");
  const [token, setToken] = useState("");
  const [headerName, setHeaderName] = useState("X-API-Key");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<unknown>(null);

  // -- Step 2 state --
  const [dataPath, setDataPath] = useState("");
  const [resolvedData, setResolvedData] = useState<Dataset>([]);

  // -- Step 3 state --
  const [fields, setFields] = useState<FieldInfo[]>([]);
  const [entries, setEntries] = useState<WEntry[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // ---- Derived field lists ----
  const numericFields = fields.filter((f) => f.kind === "numeric");
  const dateFields = fields.filter((f) => f.kind === "date");
  const catFields = fields.filter((f) => f.kind === "categorical");

  // ---- Step 1: test connection ----

  const resetDataResult = () => {
    setRawResponse(null);
    setResolvedData([]);
    setDataPath("");
    setFields([]);
    setEntries([]);
    setTestError(null);
  };

  const handleTestApi = async () => {
    setTestError(null);
    setTesting(true);
    resetDataResult();

    const auth: AuthConfig = {
      type: authType,
      token: token || undefined,
      headerName: headerName || undefined,
      username: username || undefined,
      password: password || undefined,
    };

    try {
      const res = await fetch("/api/data/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: apiUrl.trim(), auth }),
      });
      const json = await res.json();

      if (!res.ok) {
        setTestError(json.error ?? "Request failed");
        setTesting(false);
        return;
      }

      setRawResponse(json.data);

      // If root is already an array, resolve immediately
      if (Array.isArray(json.data)) {
        const dataset = toDataset(json.data);
        setDataPath("");
        setResolvedData(dataset);
        setFields(detectFields(dataset));
      }
    } catch (err) {
      setTestError(err instanceof Error ? err.message : "Network error");
    } finally {
      setTesting(false);
    }
  };

  const handleSyncSnapshot = async () => {
    setTestError(null);
    setTesting(true);
    resetDataResult();

    try {
      let dataset: Dataset = [];
      let sourceLabel = "";

      if (sourceFile) {
        const lowerName = sourceFile.name.toLowerCase();
        if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
          const buffer = await sourceFile.arrayBuffer();
          dataset = parseExcelData(buffer);
        } else {
          const text = await sourceFile.text();
          dataset = parseTextData(text);
        }
        sourceLabel = sourceFile.name;
      } else if (sourceUrl.trim()) {
        const preparedUrl =
          sourceType === "gsheet"
            ? detectGoogleSheetCsvUrl(sourceUrl.trim())
            : sourceUrl.trim();
        const res = await fetch(preparedUrl);
        if (!res.ok) {
          throw new Error(`Could not fetch source (${res.status})`);
        }
        const contentType =
          res.headers.get("content-type")?.toLowerCase() ?? "";
        const isExcelByUrl = /\.(xlsx|xls)(\?|$)/i.test(preparedUrl);
        if (
          contentType.includes(
            "application/vnd.openxmlformats-officedocument",
          ) ||
          contentType.includes("application/vnd.ms-excel") ||
          isExcelByUrl
        ) {
          const buffer = await res.arrayBuffer();
          dataset = parseExcelData(buffer);
        } else {
          const text = await res.text();
          dataset = parseTextData(text);
        }
        sourceLabel = preparedUrl;
      } else {
        throw new Error("Provide a link or choose a file to sync");
      }

      if (!dataset.length) {
        throw new Error("No tabular records found in this source");
      }

      setApiUrl(sourceLabel);
      setRawResponse(dataset);
      setResolvedData(dataset.slice(0, 500));
      setFields(detectFields(dataset.slice(0, 500)));
    } catch (err) {
      setTestError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setTesting(false);
    }
  };

  // ---- Step 2: select data path ----

  const handleSelectPath = (path: string) => {
    setDataPath(path);
    const resolved = resolvePath(rawResponse, path);
    if (Array.isArray(resolved)) {
      const dataset = resolved.slice(0, 500).map((row) => flattenObject(row));
      setResolvedData(dataset);
      setFields(detectFields(dataset));
    } else if (resolved && typeof resolved === "object") {
      // Single object → 1-row dataset (still useful for KPI snapshots).
      const dataset: Dataset = [flattenObject(resolved)];
      setResolvedData(dataset);
      setFields(detectFields(dataset));
    }
  };

  // ---- Step 3: widget quick-add ----

  const addKpi = (f: FieldInfo) => {
    setEntries((prev) => [
      ...prev,
      {
        id: `kpi-${f.name}-${uid()}`,
        type: "kpi",
        label: `KPI: ${formatLabel(f.name)}`,
        fields: [f.name],
      },
    ]);
  };

  const addLine = (f: FieldInfo) => {
    const xField = dateFields[0]?.name ?? catFields[0]?.name;
    if (!xField) return;
    setEntries((prev) => [
      ...prev,
      {
        id: `line-${f.name}-${uid()}`,
        type: "line",
        label: `${formatLabel(f.name)} over ${formatLabel(xField)}`,
        fields: [xField, f.name],
      },
    ]);
  };

  const addBar = (f: FieldInfo) => {
    const xField = catFields[0]?.name ?? dateFields[0]?.name;
    if (!xField) return;
    setEntries((prev) => [
      ...prev,
      {
        id: `bar-${f.name}-${uid()}`,
        type: "bar",
        label: `${formatLabel(f.name)} by ${formatLabel(xField)}`,
        fields: [xField, f.name],
      },
    ]);
  };

  const addPie = (f: FieldInfo) => {
    const valueField = numericFields[0]?.name;
    if (!valueField) return;
    setEntries((prev) => [
      ...prev,
      {
        id: `pie-${f.name}-${uid()}`,
        type: "pie",
        label: `${formatLabel(f.name)} breakdown`,
        fields: [f.name, valueField],
      },
    ]);
  };

  // ---- Finish: build DashWidget[] and create ----

  const handleCreate = async () => {
    setCreateError(null);

    const auth: AuthConfig =
      sourceType === "api"
        ? {
            type: authType,
            token: token || undefined,
            headerName: headerName || undefined,
            username: username || undefined,
            password: password || undefined,
          }
        : { type: "none" };

    const widgets: DashWidget[] = [];
    const layout: GridItem[] = [];

    for (const e of entries) {
      switch (e.type) {
        case "kpi":
          widgets.push({
            id: e.id,
            type: "kpi",
            field: e.fields[0],
            label: `Total ${formatLabel(e.fields[0])}`,
            metric: "sum",
          });
          layout.push({ i: e.id, span: 3, height: 120 });
          break;
        case "line":
          widgets.push({
            id: e.id,
            type: "line",
            x: e.fields[0],
            y: e.fields[1]!,
            label: e.label,
            metric: "sum",
          });
          layout.push({ i: e.id, span: 6, height: 280 });
          break;
        case "bar":
          widgets.push({
            id: e.id,
            type: "bar",
            x: e.fields[0],
            y: e.fields[1]!,
            label: e.label,
            metric: "sum",
          });
          layout.push({ i: e.id, span: 6, height: 280 });
          break;
        case "pie":
          widgets.push({
            id: e.id,
            type: "pie",
            category: e.fields[0],
            value: e.fields[1]!,
            label: e.label,
            metric: "sum",
          });
          layout.push({ i: e.id, span: 6, height: 280 });
          break;
      }
    }

    setCreating(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim() || "Untitled Dashboard",
          apiUrl: apiUrl.trim(),
          authConfig: auth,
          dataPath,
          widgets,
          layout,
          data: resolvedData,
          filters: [],
          isPublic: true,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "Could not create dashboard.");
      }

      const createdId = json.project?.id as string | undefined;

      if (!createdId) {
        throw new Error("Dashboard created without an id.");
      }

      onCreated?.(createdId);
      router.push(`/projects/${createdId}`);
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Could not create dashboard.",
      );
    } finally {
      setCreating(false);
    }
  };

  // ---- Helpers ----

  const arrayPaths =
    rawResponse && !Array.isArray(rawResponse)
      ? findArrayPaths(rawResponse)
      : [];
  const testOk = rawResponse !== null;
  const step1Ready = sourceType === "api" ? !!apiUrl.trim() && testOk : testOk;
  const step2Ready = resolvedData.length > 0;

  const WIDGET_ICON: Record<string, string> = {
    kpi: "◆",
    line: "↗",
    bar: "▇",
    pie: "◕",
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      className={
        mode === "modal"
          ? "fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm"
          : "mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-8"
      }
      onClick={mode === "modal" ? onClose : undefined}
    >
      <div
        className={
          mode === "modal"
            ? "relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            : "relative flex w-full flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
        }
        style={{ maxHeight: mode === "modal" ? "90vh" : "none" }}
        onClick={mode === "modal" ? (e) => e.stopPropagation() : undefined}
      >
        {/* ---- Header ---- */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              New Dashboard
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              {step === 1 && "Pick source and connect"}
              {step === 2 && "Select data source"}
              {step === 3 && "Map fields to widgets"}
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {([1, 2, 3] as Step[]).map((s) => (
              <div
                key={s}
                className={`h-2 w-2 rounded-full transition-colors ${
                  s === step
                    ? "bg-zinc-900"
                    : s < step
                      ? "bg-zinc-400"
                      : "bg-zinc-200"
                }`}
              />
            ))}
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          >
            <svg
              width="14"
              height="14"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* ---- Body ---- */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ========== STEP 1: Connect ========== */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-700">
                  Source type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "api", label: "API" },
                    { id: "excel", label: "Excel" },
                    { id: "gsheet", label: "Google Sheet" },
                  ].map((source) => (
                    <button
                      key={source.id}
                      onClick={() => {
                        setSourceType(source.id as "api" | "excel" | "gsheet");
                        resetDataResult();
                        setSourceUrl("");
                        setSourceFile(null);
                      }}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                        sourceType === source.id
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                      }`}
                    >
                      {source.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dashboard name */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-700">
                  Dashboard name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500"
                  placeholder="My Dashboard"
                />
              </div>

              {sourceType === "api" ? (
                <>
                  {/* API URL + test */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-700">
                      API endpoint
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-1 items-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 transition focus-within:border-zinc-500 focus-within:bg-white">
                        <span className="select-none px-3 text-xs text-zinc-400">
                          GET
                        </span>
                        <input
                          type="url"
                          value={apiUrl}
                          onChange={(e) => {
                            setApiUrl(e.target.value);
                            setRawResponse(null);
                            setTestError(null);
                          }}
                          onKeyDown={(e) =>
                            e.key === "Enter" &&
                            !testing &&
                            apiUrl.trim() &&
                            handleTestApi()
                          }
                          placeholder="https://api.example.com/v1/sales"
                          className="flex-1 bg-transparent py-2 pr-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
                        />
                      </div>
                      <button
                        onClick={handleTestApi}
                        disabled={testing || !apiUrl.trim()}
                        className="flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50"
                      >
                        {testing && (
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        )}
                        {testing ? "Testing…" : "Test →"}
                      </button>
                    </div>

                    {testError && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-red-500">
                        <svg
                          width="12"
                          height="12"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                          />
                        </svg>
                        {testError}
                      </p>
                    )}
                    {testOk && !testError && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600">
                        <svg
                          width="12"
                          height="12"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Connection successful
                        {Array.isArray(rawResponse) &&
                          ` · ${rawResponse.length} records`}
                      </p>
                    )}
                  </div>

                  {/* Auth type selector */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-700">
                      Authentication
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(
                        ["none", "bearer", "apikey", "basic"] as AuthType[]
                      ).map((t) => (
                        <button
                          key={t}
                          onClick={() => setAuthType(t)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                            authType === t
                              ? "border-zinc-900 bg-zinc-900 text-white"
                              : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                          }`}
                        >
                          {t === "none"
                            ? "None"
                            : t === "bearer"
                              ? "Bearer"
                              : t === "apikey"
                                ? "API Key"
                                : "Basic"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Auth fields */}
                  {authType === "bearer" && (
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-700">
                        Bearer token
                      </label>
                      <input
                        type="password"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="eyJ…"
                        className="w-full rounded-lg border border-zinc-200 px-3 py-2 font-mono text-sm outline-none focus:border-zinc-500"
                      />
                    </div>
                  )}

                  {authType === "apikey" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-700">
                          Header name
                        </label>
                        <input
                          value={headerName}
                          onChange={(e) => setHeaderName(e.target.value)}
                          placeholder="X-API-Key"
                          className="w-full rounded-lg border border-zinc-200 px-3 py-2 font-mono text-sm outline-none focus:border-zinc-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-700">
                          Key value
                        </label>
                        <input
                          type="password"
                          value={token}
                          onChange={(e) => setToken(e.target.value)}
                          placeholder="sk-…"
                          className="w-full rounded-lg border border-zinc-200 px-3 py-2 font-mono text-sm outline-none focus:border-zinc-500"
                        />
                      </div>
                    </div>
                  )}

                  {authType === "basic" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-700">
                          Username
                        </label>
                        <input
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-zinc-700">
                          Password
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                    Excel and Google Sheet imports are synced once when you
                    click sync. They do not auto-refresh.
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-700">
                      Link (optional)
                    </label>
                    <input
                      type="url"
                      value={sourceUrl}
                      onChange={(e) => {
                        setSourceUrl(e.target.value);
                        setTestError(null);
                        setRawResponse(null);
                      }}
                      placeholder={
                        sourceType === "excel"
                          ? "https://example.com/sales.xlsx"
                          : "https://docs.google.com/spreadsheets/d/..."
                      }
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-700">
                      File (optional)
                    </label>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv,.json"
                      onChange={(e) => {
                        setSourceFile(e.target.files?.[0] ?? null);
                        setTestError(null);
                        setRawResponse(null);
                      }}
                      className="block w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-2.5 file:py-1.5 file:text-xs file:font-medium file:text-zinc-700 hover:file:bg-zinc-200"
                    />
                  </div>
                  <button
                    onClick={handleSyncSnapshot}
                    disabled={testing || (!sourceUrl.trim() && !sourceFile)}
                    className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50"
                  >
                    {testing && (
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    )}
                    {testing ? "Syncing…" : "Sync once →"}
                  </button>

                  {testError && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-red-500">
                      <svg
                        width="12"
                        height="12"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                        />
                      </svg>
                      {testError}
                    </p>
                  )}
                  {testOk && !testError && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600">
                      <svg
                        width="12"
                        height="12"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Snapshot synced · {resolvedData.length} records
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* ========== STEP 2: Select data path ========== */}
          {step === 2 && (
            <div className="space-y-4">
              {Array.isArray(rawResponse) ? (
                <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    className="shrink-0 text-emerald-600"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-sm text-emerald-700">
                    Root is an array · <strong>{rawResponse.length}</strong>{" "}
                    records · ready to map fields
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-zinc-600">
                    The response is an object. Select which key contains your
                    data records:
                  </p>
                  {arrayPaths.length === 0 ? (
                    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-400">
                      No array fields found. The response may not contain
                      tabular data.
                    </div>
                  ) : (
                    arrayPaths.map(({ path, length, sample }) => (
                      <button
                        key={path}
                        onClick={() => handleSelectPath(path)}
                        className={`flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm transition ${
                          dataPath === path
                            ? "border-zinc-900 bg-zinc-900 text-white"
                            : "border-zinc-200 hover:border-zinc-400"
                        }`}
                      >
                        <span className="flex-1 truncate font-mono">
                          {path}
                          <span
                            className={`ml-2 truncate font-sans text-[11px] ${dataPath === path ? "text-zinc-400" : "text-zinc-400"}`}
                          >
                            {sample}
                          </span>
                        </span>
                        <span
                          className={`shrink-0 text-xs ${dataPath === path ? "text-zinc-300" : "text-zinc-400"}`}
                        >
                          {length} items
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Collapsible raw JSON preview */}
              <details className="group">
                <summary className="cursor-pointer select-none text-xs text-zinc-400 hover:text-zinc-600">
                  View raw response ▸
                </summary>
                <pre className="mt-2 max-h-52 overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-600">
                  {JSON.stringify(rawResponse, null, 2).slice(0, 4000)}
                  {JSON.stringify(rawResponse, null, 2).length > 4000
                    ? "\n\n…truncated"
                    : ""}
                </pre>
              </details>
            </div>
          )}

          {/* ========== STEP 3: Map fields ========== */}
          {step === 3 && (
            <div className="flex min-h-0 gap-5">
              {/* Left: detected fields */}
              <div className="w-1/2 space-y-2 overflow-y-auto">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                  Detected fields ({fields.length})
                </p>
                {fields.map((field) => {
                  const badge = KIND_BADGE[field.kind];
                  return (
                    <div
                      key={field.name}
                      className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2.5"
                    >
                      <div className="mb-1.5 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${badge.cls}`}
                        >
                          {badge.label}
                        </span>
                        <span className="truncate text-xs font-medium text-zinc-700">
                          {field.name}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {field.kind === "numeric" && (
                          <>
                            <button
                              onClick={() => addKpi(field)}
                              className="rounded border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-600 hover:border-zinc-400"
                            >
                              + KPI
                            </button>
                            <button
                              onClick={() => addLine(field)}
                              disabled={!dateFields.length && !catFields.length}
                              className="rounded border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-600 hover:border-zinc-400 disabled:opacity-40"
                            >
                              + Line
                            </button>
                            <button
                              onClick={() => addBar(field)}
                              disabled={!catFields.length && !dateFields.length}
                              className="rounded border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-600 hover:border-zinc-400 disabled:opacity-40"
                            >
                              + Bar
                            </button>
                          </>
                        )}
                        {field.kind === "categorical" && (
                          <>
                            <button
                              onClick={() => addPie(field)}
                              disabled={!numericFields.length}
                              className="rounded border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-600 hover:border-zinc-400 disabled:opacity-40"
                            >
                              + Pie
                            </button>
                            <button
                              onClick={() => {
                                const valueField = numericFields[0];
                                if (!valueField) return;
                                setEntries((prev) => [
                                  ...prev,
                                  {
                                    id: `bar-${field.name}-${uid()}`,
                                    type: "bar",
                                    label: `${formatLabel(valueField.name)} by ${formatLabel(field.name)}`,
                                    fields: [field.name, valueField.name],
                                  },
                                ]);
                              }}
                              disabled={!numericFields.length}
                              className="rounded border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-600 hover:border-zinc-400 disabled:opacity-40"
                            >
                              + Bar X-axis
                            </button>
                          </>
                        )}
                        {(field.kind === "date" || field.kind === "text") && (
                          <span className="text-[10px] text-zinc-400">
                            Used as axis automatically
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right: widget preview */}
              <div className="w-1/2 space-y-2">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                  Widgets to create ({entries.length})
                </p>

                {entries.length === 0 ? (
                  <div className="flex h-36 items-center justify-center rounded-lg border border-dashed border-zinc-200 text-xs text-zinc-400">
                    Add widgets from the fields →
                  </div>
                ) : (
                  entries.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="shrink-0 text-sm">
                          {WIDGET_ICON[e.type]}
                        </span>
                        <span className="truncate text-xs text-zinc-700">
                          {e.label}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          setEntries((prev) =>
                            prev.filter((x) => x.id !== e.id),
                          )
                        }
                        className="ml-2 shrink-0 text-zinc-300 hover:text-red-400"
                        aria-label="Remove widget"
                      >
                        <svg
                          width="12"
                          height="12"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* ---- Footer ---- */}
        <div className="flex items-center justify-between border-t border-zinc-100 px-6 py-4">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="text-sm text-zinc-500 hover:text-zinc-700"
            >
              ← Back
            </button>
          ) : (
            <button
              onClick={onClose ?? (() => router.push("/dashboard"))}
              className="text-sm text-zinc-500 hover:text-zinc-700"
            >
              Cancel
            </button>
          )}

          {step === 1 && (
            <button
              onClick={() => setStep(2)}
              disabled={!step1Ready}
              className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-40"
            >
              Next →
            </button>
          )}
          {step === 2 && (
            <button
              onClick={() => setStep(3)}
              disabled={!step2Ready}
              className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-40"
            >
              Map fields →
            </button>
          )}
          {step === 3 && (
            <button
              onClick={handleCreate}
              disabled={entries.length === 0 || creating}
              className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-40"
            >
              {creating ? "Creating..." : "Create Dashboard →"}
            </button>
          )}
        </div>
        {createError && (
          <div className="border-t border-zinc-100 px-6 py-3">
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {createError}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
