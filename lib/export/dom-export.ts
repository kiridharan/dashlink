import { toPng } from "html-to-image";

/**
 * Client-side dashboard export.
 *
 * Captures a live DOM node (the rendered widget grid) to a raster image and,
 * for PDF, lays that image onto one or more pages. Runs entirely in the browser
 * so there is no headless-browser infrastructure to operate — the trade-off is
 * that the node must be fully rendered and on-screen when capture is invoked.
 */

export type ExportFormat = "png" | "pdf";

interface ExportOptions {
  /** Filename without extension. */
  filename: string;
  /** Solid background painted behind the node (charts/cards are transparent). */
  backgroundColor?: string;
  /** Device pixel ratio for the raster — higher = sharper, larger file. */
  pixelRatio?: number;
}

// html-to-image occasionally races web-font / async layout on the first pass;
// capturing twice yields a stable result. Cheap relative to a user-facing export.
async function nodeToPng(
  node: HTMLElement,
  backgroundColor: string,
  pixelRatio: number,
): Promise<string> {
  const opts = { backgroundColor, pixelRatio, cacheBust: true };
  await toPng(node, opts);
  return toPng(node, opts);
}

function triggerDownload(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export async function exportNodeToPng(
  node: HTMLElement,
  { filename, backgroundColor = "#ffffff", pixelRatio = 2 }: ExportOptions,
): Promise<void> {
  const dataUrl = await nodeToPng(node, backgroundColor, pixelRatio);
  triggerDownload(dataUrl, `${filename}.png`);
}

export async function exportNodeToPdf(
  node: HTMLElement,
  { filename, backgroundColor = "#ffffff", pixelRatio = 2 }: ExportOptions,
): Promise<void> {
  const dataUrl = await nodeToPng(node, backgroundColor, pixelRatio);

  // jsPDF is heavy (~350KB); load it only when a PDF is actually requested.
  const { jsPDF } = await import("jspdf");

  const img = new Image();
  img.src = dataUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to rasterize dashboard"));
  });

  const orientation = img.width >= img.height ? "landscape" : "portrait";
  const pdf = new jsPDF({ orientation, unit: "pt", format: "a4" });

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  // Scale the capture to the page width, then slice it across pages so tall
  // dashboards paginate instead of being squashed onto one sheet.
  const renderW = pageW;
  const renderH = (img.height / img.width) * pageW;

  if (renderH <= pageH) {
    pdf.addImage(dataUrl, "PNG", 0, 0, renderW, renderH);
  } else {
    let remaining = renderH;
    let offset = 0;
    while (remaining > 0) {
      pdf.addImage(dataUrl, "PNG", 0, offset, renderW, renderH);
      remaining -= pageH;
      if (remaining > 0) {
        pdf.addPage();
        offset -= pageH;
      }
    }
  }

  pdf.save(`${filename}.pdf`);
}

export async function exportNode(
  node: HTMLElement,
  format: ExportFormat,
  options: ExportOptions,
): Promise<void> {
  if (format === "pdf") return exportNodeToPdf(node, options);
  return exportNodeToPng(node, options);
}
