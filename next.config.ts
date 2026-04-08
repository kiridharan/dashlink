import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Stops Turbopack from scanning ancestor directories (macOS permission issue)
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
