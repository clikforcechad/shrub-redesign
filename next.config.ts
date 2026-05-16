import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "oaidalleapiprodscus.blob.core.windows.net" },
      { protocol: "https", hostname: "*.openai.com" },
      { protocol: "https", hostname: "*.svc.ms" },
      { protocol: "https", hostname: "*.windows.net" },
    ],
  },
};

export default nextConfig;
