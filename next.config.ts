import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // O app é renderizado por requisição (marca do tenant + login). Só valida navegação
    // instantânea nas páginas que marcarem `export const instant = true`.
    instantInsights: { validationLevel: "manual-warning" },
    // entregas das game jams: projeto (até 25 MB) + documentação (até 10 MB)
    serverActions: { bodySizeLimit: "40mb" },
    proxyClientMaxBodySize: "40mb",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
