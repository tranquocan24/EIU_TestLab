import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  outputFileTracingRoot: process.cwd(),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.haitrieu.com',
        pathname: '/wp-content/uploads/**',
      },
    ],
  },
};

export default nextConfig;
