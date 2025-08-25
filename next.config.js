/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  webpack: (config, { isServer }) => {
    // Handle node modules that need to be external
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    // Handle Monaco Editor
    config.module.rules.push({
      test: /\.monaco\.ts$/,
      use: 'raw-loader',
    });

    return config;
  },
  images: {
    domains: ['images.unsplash.com'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

module.exports = nextConfig;