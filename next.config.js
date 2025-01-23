/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"]
    },
    turbo: {
      rules: {
        // Option to enable Turbo
        "*.css": {
          loaders: ["postcss-loader"],
        },
      },
    },
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.css$/,
      use: ['postcss-loader'],
    });
    return config;
  },
}

module.exports = nextConfig 