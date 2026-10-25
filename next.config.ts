import type { NextConfig } from "next";

// The browser talks to /lum-api/* on this site; Next proxies it to the Lumticket API.
// This avoids CORS entirely (the API only whitelists a few origins).
const API_URL = "https://api.lumticket.com";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [{ source: "/lum-api/:path*", destination: `${API_URL}/:path*` }];
  },
};

export default nextConfig;
