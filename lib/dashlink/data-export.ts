import type { Dataset, DataValue } from "./types";

/**
 * Tabular data export (CSV / Excel).
 *
 * Operates on a resolved `Dataset` — i.e. the rows already filtered/aggregated
 * for display — so a download matches exactly what the viewer sees. `xlsx` is
 * dynamically imported so its weight only loads when an Excel export runs.
 */

function columnsOf(rows: Dataset): string[] {
  const seen = new Set<string>();
  const cols: string[] = [];
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key);
        cols.push(key);
      }
    }
  }
  return cols;
}

function csvCell(value: DataValue): string {
  if (value === null || value === undefined) return "";
  const str = typeof value === "number" ? String(value) : String(value);
  // Quote when the cell contains a delimiter, quote, or newline (RFC 4180).
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function datasetToCsv(rows: Dataset, columns?: string[]): string {
  const cols = columns ?? columnsOf(rows);
  const header = cols.map(csvCell).join(",");
  const body = rows
    .map((row) => cols.map((c) => csvCell(row[c] ?? null)).join(","))
    .join("\r\n");
  return body ? `${header}\r\n${body}` : header;
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportDatasetToCsv(
  rows: Dataset,
  filename: string,
  columns?: string[],
): void {
  const csv = datasetToCsv(rows, columns);
  // BOM so Excel opens UTF-8 correctly.
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8;" });
  triggerBlobDownload(blob, `${filename}.csv`);
}

export async function exportDatasetToXlsx(
  rows: Dataset,
  filename: string,
  columns?: string[],
  sheetName = "Data",
): Promise<void> {
  const XLSX = await import("xlsx");
  const cols = columns ?? columnsOf(rows);
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: cols });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
