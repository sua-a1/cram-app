/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Don't fail build on TS errors during deployment
    ignoreBuildErrors: true,
  },
  eslint: {
    // Don't fail build on eslint errors during deployment
    ignoreDuringBuilds: true,
  },
  // Configure source directory
  pageExtensions: ['tsx', 'ts'],
  webpack: (config, { isServer }) => {
    // Exclude agent-related files from the build
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    // Ignore agent-related files in production build
    config.module.rules.push({
      test: /agents\//,
      loader: 'ignore-loader'
    });

    return config;
  },
  experimental: {
    // Needed for some of our dependencies
    serverComponentsExternalPackages: ['@langchain/langgraph', '@langchain/langgraph-cli']
  }
};

export default nextConfig;