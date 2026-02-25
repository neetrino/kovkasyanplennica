/** @type {import('next').NextConfig} */
const path = require('path');
const fs = require('fs');

// Load env from repo root and env/ so app works when .env was moved to env/
const rootDir = path.resolve(__dirname, '../..');
const envPaths = [
  path.join(rootDir, '.env'),
  path.join(rootDir, 'env', '.env'),
  path.join(rootDir, 'env', '.env.local'),
];
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eq = trimmed.indexOf('=');
        if (eq > 0) {
          const key = trimmed.slice(0, eq).trim();
          let val = trimmed.slice(eq + 1).trim();
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1).replace(/\\"/g, '"');
          if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1).replace(/\\'/g, "'");
          process.env[key] = val;
        }
      }
    }
  }
}

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@shop/ui', '@shop/design-tokens', '@white-shop/db'],
  // Standalone output - prevents prerendering of 404 page
  output: 'standalone',
  // typescript.ignoreBuildErrors removed - build will fail on TypeScript errors
  // This ensures type safety in production builds     
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn-icons-png.flaticon.com',
        pathname: '/**',
      },
    ],
    // Allow unoptimized images for development (images will use unoptimized prop)
    // Ensure image optimization is enabled for production
    formats: ['image/avif', 'image/webp'],
    // In development, disable image optimization globally to allow any local IP
    // Components can still use unoptimized prop, but this ensures all images work
    unoptimized: process.env.NODE_ENV === 'development',
  },
  // Fix for HMR issues in Next.js 15
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    
    // Resolve workspace packages and path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '.'),
      '@shop/ui': path.resolve(__dirname, '../../packages/ui'),
      '@shop/design-tokens': path.resolve(__dirname, '../../packages/design-tokens'),
      '@white-shop/db': path.resolve(__dirname, '../../packages/db'),
    };
    
    return config;
  },
  // Turbopack configuration for monorepo (Next.js 16 uses Turbopack by default in dev)
  // resolveAlias: relative paths from root — Turbopack does not support Windows absolute paths
  turbopack: {
    root: path.resolve(__dirname, '../..'),
    resolveAlias: {
      '@shop/ui': 'packages/ui',
      '@shop/design-tokens': 'packages/design-tokens',
      '@white-shop/db': 'packages/db',
    },
  },
};

module.exports = nextConfig;

