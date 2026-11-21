import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // services that are no longer offered; their old links land on what is
  redirects: async () =>
    ["expedited-freight", "emergency-shipping"].map((slug) => ({
      source: `/services/${slug}`,
      destination: "/#services",
      permanent: true,
    })),
};

export default nextConfig;
