import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Short version code shown in the footer: Netlify provides COMMIT_REF at build time.
  env: {
    NEXT_PUBLIC_COMMIT_SHA: process.env.COMMIT_REF || "",
  },
};

export default nextConfig;
