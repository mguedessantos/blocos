@AGENTS.md

# Blocos — SaaS de programação em blocos (pt-BR, white-label)

Plano completo: ~/.claude/plans/i-want-to-create-refactored-floyd.md

## Regras do projeto
- **Toda a interface em português do Brasil.** Código/identificadores podem ser em inglês.
- **Multi-tenant:** nunca use `db` direto em páginas/ações. Use helpers de `src/lib/dal/*`, que recebem o usuário (`requireUser`) e filtram por `organizationId`.
- **Autorização:** `requireUser([...roles])` em toda página, server action e route handler. O `src/proxy.ts` é só uma checagem otimista.
- **Tenant / marca:** `getTenant()` (domínio acessado) e `getBrand()` (marca efetiva). White-label só vale com `hasFeature(sub, "white_label")`.
- **Recursos pagos** passam por `src/lib/billing/entitlements.ts`.
- **LGPD:** alunos não têm email; nunca enviar nome/ID de aluno para a IA.
- Next.js 16: `proxy.ts` (não middleware), `params`/`searchParams`/`cookies()`/`headers()` são assíncronos; Cache Components ativo (root layout usa `instant = false`).
- Prisma 7: client gerado em `src/generated/prisma` (`npx prisma generate`), adapter `@prisma/adapter-pg`.

## Comandos
- Banco local: `npx prisma dev --name blocos --detach` → `npx prisma migrate deploy` → `npm run db:seed`
- **Atenção:** o `prisma dev` local tem UM único banco (qualquer nome cai no mesmo). Nunca configure `shadowDatabaseUrl` nem rode `migrate dev`/`migrate reset` contra ele — o reset do "shadow" apaga o banco real.
  Para criar uma migração: `mkdir prisma/migrations/<AAAAMMDDHHMMSS>_<nome>` e
  `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script > prisma/migrations/<pasta>/migration.sql`, depois `npx prisma migrate deploy` e `npx prisma generate`.
- Banco local instável ("Connection terminated"/ECONNRESET): `npx prisma dev stop blocos` e `npx prisma dev --name blocos --detach` (os dados são mantidos). Use `DATABASE_POOL_MAX="1"` no .env local.
- Stripe: `npm run stripe:setup` (cria produtos/preços a partir da tabela Plan; preços em prisma/seed.ts) · `npm run stripe:listen` (webhooks locais → STRIPE_WEBHOOK_SECRET)
- `npm run dev` · `npm test` (Vitest) · `npm run test:e2e` (Playwright) · `npm run typecheck` · `npm run lint`
- Subdomínios locais: http://escola-demo.localhost:3000 (Escola+, white-label), http://prof-marina.localhost:3000 (plano Professor)

## Contas de demonstração (seed)
- Super admin: admin@blocos.dev / admin123 (http://localhost:3000)
- Coordenação: coord@aurora.dev / senha123 · Professor: prof@aurora.dev / senha123
- Alunos: turma ROBO42, usuários ana | bruno | clara, senha gato123
- Professora independente: marina@prof.dev / senha123 (turma GATO77)
