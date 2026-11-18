import type { NextConfig } from "next";

// CSP em Report-Only: só reporta violações, não bloqueia nada (seguro de ligar).
// Depois de acompanhar os relatórios, troque a chave para "Content-Security-Policy" e
// endureça script-src (nonce/hash em vez de 'unsafe-inline').
// shortcut: 'unsafe-inline' em script/style e sem nonce; endurecer ao migrar de Report-Only para enforce.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "frame-src 'self'", // editor TurboWarp roda em /editor (mesma origem)
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Content-Security-Policy-Report-Only", value: csp },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // o PDF do manual embute as capturas lidas do disco
  outputFileTracingIncludes: { "/manual/pdf": ["./public/manual/*.png"] },
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
