import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Fix lockfile warning
  outputFileTracingRoot: process.cwd(),
  // Prevent build cache issues
  experimental: {
    // Disable features that cause cache issues
    optimizePackageImports: [],
  },
  // Better error handling
  serverExternalPackages: [],
  // Disable turbopack for development to avoid build manifest errors
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules/**', '**/.git/**'],
      };
      // Better cache handling
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
    }
    return config;
  },
  // Prevent module resolution issues
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
