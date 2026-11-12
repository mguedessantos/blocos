import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrações usam a conexão DIRETA (no Supabase: pooler em modo sessão, porta 5432).
    // O site usa DATABASE_URL (pooler em modo transação, porta 6543).
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
