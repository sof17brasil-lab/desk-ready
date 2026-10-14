import type { NextConfig } from "next";

// Static export for GitHub Pages. basePath must match the repo name so assets
// resolve under https://<user>.github.io/desk-ready/. Set DESK_READY_BASE_PATH=""
// to build for a root-domain host instead.
const basePath =
  process.env.DESK_READY_BASE_PATH ?? (process.env.NODE_ENV === "production" ? "/desk-ready" : "");

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  images: { unoptimized: true },
  trailingSlash: true,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
