import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Evita que Next.js intente bundlear módulos nativos de Node.js durante el build
  serverExternalPackages: ['pg', 'pg-native', '@neondatabase/serverless'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    instrumentationHook: true,
  },
};

export default nextConfig;
