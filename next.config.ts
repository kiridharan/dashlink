import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Pin the workspace root to this project so Next 16 / Turbopack don't
  // walk up and pick the stray /Users/kiridharan/Documents/FOSS/BYD/package.json
  // as the root (which would break module resolution for tailwindcss, etc.).
  turbopack: {
    root: path.resolve(__dirname),
  },
  outputFileTracingRoot: path.resolve(__dirname),
  async headers() {
    return [
      {
        // Allow embedding the embed routes in any origin's iframe.
        source: "/embed/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
          { key: "X-Frame-Options", value: "ALLOWALL" },
          {
            key: "Cache-Control",
            value:
              "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
          },
        ],
      },
      {
        source: "/embed.js",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=300" },
        ],
      },
    ];
  },
};

export default nextConfig;
