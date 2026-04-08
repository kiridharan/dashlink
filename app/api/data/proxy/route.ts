import { NextRequest, NextResponse } from "next/server";
import type { AuthConfig } from "@/lib/dashlink/types";

const FETCH_TIMEOUT_MS = 15_000;

export async function POST(req: NextRequest) {
  let body: { url: string; auth: AuthConfig };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { url, auth } = body;
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  // Validate URL scheme to prevent SSRF via non-http protocols
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return NextResponse.json(
      { error: "Only HTTP/HTTPS URLs are allowed" },
      { status: 400 },
    );
  }

  // Block private/loopback addresses in production to prevent SSRF
  if (process.env.NODE_ENV === "production") {
    const host = parsed.hostname.toLowerCase();
    const isPrivate =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host === "0.0.0.0" ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host);

    if (isPrivate) {
      return NextResponse.json(
        { error: "Private network addresses are not allowed" },
        { status: 400 },
      );
    }
  }

  // Build auth headers
  const headers: Record<string, string> = { Accept: "application/json" };
  if (auth?.type === "bearer" && auth.token) {
    headers["Authorization"] = `Bearer ${auth.token}`;
  } else if (auth?.type === "apikey" && auth.token) {
    const headerName = auth.headerName?.trim() || "X-API-Key";
    headers[headerName] = auth.token;
  } else if (auth?.type === "basic" && auth.username && auth.password) {
    const encoded = Buffer.from(`${auth.username}:${auth.password}`).toString(
      "base64",
    );
    headers["Authorization"] = `Basic ${encoded}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const text = await res.text();

    if (!res.ok) {
      return NextResponse.json(
        {
          error: `API responded ${res.status} ${res.statusText}`,
          status: res.status,
        },
        { status: 502 },
      );
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Response is not valid JSON", preview: text.slice(0, 300) },
        { status: 422 },
      );
    }

    return NextResponse.json({ data });
  } catch (err) {
    clearTimeout(timeoutId);
    const message = err instanceof Error ? err.message : "Request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
