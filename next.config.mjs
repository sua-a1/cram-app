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
  // Configure build output and source
  distDir: '.next',
  experimental: {
    // Needed for some of our dependencies
    serverComponentsExternalPackages: ['@langchain/langgraph', '@langchain/langgraph-cli'],
    // Enable proper ES modules support
    esmExternals: true,
  },
  // Configure source directory
  basePath: '',
  poweredByHeader: false,
  // Configure source paths
  webpack: (config, { isServer }) => {
    // Add src directory to module resolution
    config.resolve.modules.push('./src');

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

    // Add support for .mjs files
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });

    return config;
  }
};

export default nextConfig;