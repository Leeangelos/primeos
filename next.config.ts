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
      {
        source: "/signup",
        destination: "/signup.html",
      },
    ];
  },
};

export default nextConfig;
