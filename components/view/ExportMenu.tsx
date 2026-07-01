"use client";

import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { exportNode, type ExportFormat } from "@/lib/export/dom-export";
import {
  exportDatasetToCsv,
  exportDatasetToXlsx,
} from "@/lib/dashlink/data-export";
import type { Dataset } from "@/lib/dashlink/types";

type ExportKind = ExportFormat | "csv" | "xlsx";

interface Props {
  /** The node to capture — typically the wrapper around the widget grid. */
  targetRef: RefObject<HTMLElement | null>;
  /** Base filename (sanitized here). */
  filename: string;
  /** Background painted behind the capture; match the dashboard page bg. */
  backgroundColor?: string;
  /** When provided, enables CSV/Excel data export of these (resolved) rows. */
  data?: Dataset;
  /** Theme tokens so the control blends into the viewer header. */
  tokens?: {
    cardBg?: string;
    border?: string;
    text?: string;
    muted?: string;
  };
}

function sanitize(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "dashboard"
  );
}

export default function ExportMenu({
  targetRef,
  filename,
  backgroundColor,
  data,
  tokens,
}: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<ExportKind | null>(null);
  const [error, setError] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hasData = !!data && data.length > 0;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const handleExport = async (kind: ExportKind) => {
    if (busy) return;
    setError(false);
    setBusy(kind);
    try {
      const name = sanitize(filename);
      if (kind === "csv") {
        exportDatasetToCsv(data ?? [], name);
      } else if (kind === "xlsx") {
        await exportDatasetToXlsx(data ?? [], name);
      } else {
        const node = targetRef.current;
        if (!node) throw new Error("Nothing to capture");
        await exportNode(node, kind, { filename: name, backgroundColor });
      }
      setOpen(false);
    } catch {
      setError(true);
    } finally {
      setBusy(null);
    }
  };

  const border = tokens?.border ?? "#e4e4e7";
  const cardBg = tokens?.cardBg ?? "#ffffff";
  const text = tokens?.text ?? "#18181b";
  const muted = tokens?.muted ?? "#71717a";

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={busy !== null}
        className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-60"
        style={{ borderColor: border, background: cardBg, color: text }}
        title="Download this dashboard"
      >
        {busy ? `Exporting ${busy.toUpperCase()}…` : "Export"}
        {!busy && (
          <span aria-hidden style={{ color: muted }}>
            ▾
          </span>
        )}
      </button>

      {open && !busy && (
        <div
          className="absolute right-0 z-30 mt-1 w-40 overflow-hidden rounded-lg border shadow-lg"
          style={{ borderColor: border, background: cardBg }}
        >
          <button
            type="button"
            onClick={() => handleExport("png")}
            className="block w-full px-3 py-2 text-left text-xs hover:opacity-70"
            style={{ color: text }}
          >
            PNG image
          </button>
          <button
            type="button"
            onClick={() => handleExport("pdf")}
            className="block w-full border-t px-3 py-2 text-left text-xs hover:opacity-70"
            style={{ color: text, borderColor: border }}
          >
            PDF document
          </button>
          {hasData && (
            <>
              <button
                type="button"
                onClick={() => handleExport("csv")}
                className="block w-full border-t px-3 py-2 text-left text-xs hover:opacity-70"
                style={{ color: text, borderColor: border }}
              >
                CSV data
              </button>
              <button
                type="button"
                onClick={() => handleExport("xlsx")}
                className="block w-full border-t px-3 py-2 text-left text-xs hover:opacity-70"
                style={{ color: text, borderColor: border }}
              >
                Excel (.xlsx)
              </button>
            </>
          )}
          {error && (
            <p
              className="border-t px-3 py-2 text-[11px]"
              style={{ borderColor: border, color: "#dc2626" }}
            >
              Export failed. Try again.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
