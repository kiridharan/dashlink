import type { NextConfig } from "next";
import path from "path";

const projectRoot = path.resolve(__dirname);
const projectNodeModules = path.join(projectRoot, "node_modules");

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Stops Turbopack from scanning ancestor directories (macOS permission issue)
  turbopack: {
    root: projectRoot,
    resolveAlias: {
      // Ensure 'tailwindcss' resolves from the project's own node_modules,
      // not from a parent directory's package.json
      tailwindcss: path.join(projectNodeModules, "tailwindcss"),
    },
  },
  // Webpack fallback: same fix for `next build` / non-turbopack paths
  webpack(config) {
    config.resolve.modules = [projectNodeModules, "node_modules"];
    return config;
  },
};

export default nextConfig;
