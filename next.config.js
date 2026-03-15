/** @type {import('next').NextConfig} */
const path = require("path");

const STUB = path.resolve(__dirname, "src/stubs/empty-module.js");

// Optional DB drivers statically imported by @google/adk but not used
const MIKRO_ORM_STUBS = {
  "@mikro-orm/postgresql": STUB,
  "@mikro-orm/mysql": STUB,
  "@mikro-orm/mariadb": STUB,
  "@mikro-orm/sqlite": STUB,
  "@mikro-orm/mssql": STUB,
};

const nextConfig = {
  reactStrictMode: true,
  env: {
    REMOTION_MAPBOX_TOKEN: process.env.REMOTION_MAPBOX_TOKEN,
  },
  serverExternalPackages: [
    "@google/adk",
    "@google/genai",
    "google-auth-library",
  ],
  // Turbopack config for Next.js 16+
  turbopack: {
    rules: {
      "*.md": {
        loaders: ["raw-loader"],
        as: "*.js",
      },
    },
    resolveAlias: MIKRO_ORM_STUBS,
  },
  // Webpack config for fallback
  webpack: (config) => {
    config.module.rules.push({
      test: /\.md$/,
      type: "asset/source",
    });
    config.resolve.alias = {
      ...config.resolve.alias,
      ...MIKRO_ORM_STUBS,
    };
    return config;
  },
};

module.exports = nextConfig;
