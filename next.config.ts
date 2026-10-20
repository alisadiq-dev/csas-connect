import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      // threepipe's package.json "main" points at a UMD bundle with no named ESM
      // exports; its real ES-module build is dist/index.mjs.
      threepipe: "threepipe/dist/index.mjs",
    },
  },
};

export default nextConfig;
