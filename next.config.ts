import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/welcome",
        destination: "/welcome.html",
      },
    ];
  },
};

export default nextConfig;
