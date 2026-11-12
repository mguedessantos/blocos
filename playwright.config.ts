import { defineConfig } from "@playwright/test";

// Pré-requisitos: banco com seed (npx prisma db seed) e app rodando (npm run build && npm start),
// ou deixe o Playwright subir o servidor de dev.
export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL: "http://localhost:3000", locale: "pt-BR" },
  webServer: { command: "npm run dev", url: "http://localhost:3000", reuseExistingServer: true, timeout: 120_000 },
});
