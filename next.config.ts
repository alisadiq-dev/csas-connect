import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev only: lets a phone/tablet on the same Wi-Fi open http://<this-machine's-LAN-IP>:3000. Without
  // this, Next blocks its dev resources for any non-localhost hostname, the page never hydrates, and
  // every button/accordion on the device is dead. Private IPv4 ranges only; ignored in production.
  allowedDevOrigins: ["10.*.*.*", "192.168.*.*", "172.*.*.*", "*.local"],
  turbopack: {
    resolveAlias: {
      // threepipe's package.json "main" points at a UMD bundle with no named ESM
      // exports; its real ES-module build is dist/index.mjs.
      threepipe: "threepipe/dist/index.mjs",
    },
  },
};

export default nextConfig;
