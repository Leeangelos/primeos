import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/welcome",
        destination: "/welcome.html",
      },
      {
        source: "/partner",
        destination: "/partner.html",
      },
    ];
  },
};

export default nextConfig;
