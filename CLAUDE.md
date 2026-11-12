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

## Editor de blocos e verificador (fase 4)
- `src/lib/blocks/catalog.ts`: blocos com opcodes do Scratch, texto pt-BR e ajuda para crianças. Só dados (importável no servidor).
- `src/lib/blocks/program.ts`: estado JSON do Blockly → `Program` neutro (o `.sb3` vai gerar o mesmo formato). Entrada do navegador é não confiável: o conversor valida tudo.
- `src/lib/blocks/interpreter.ts`: interpretador determinístico (sem eval), 30 quadros/s com tempo virtual; o mesmo código anima no navegador e verifica no servidor.
- `src/lib/checker`: especificações de verificação (zod) → 0–3 estrelas. A verificação que vale é sempre a do SERVIDOR (`submitAttempt`).
- Conteúdo: `content/trilhas/*.ts` → `npx prisma db seed` (idempotente, não apaga progresso). Toda lição de exercício precisa de solução de referência em `tests/unit/content.test.ts`.
- O estado do editor vai para a server action como string JSON (objetos do Blockly não serializam).

## Cobrança desligada por padrão
- `BILLING_ENABLED="false"` (padrão): sem preços, assinatura, banner de teste, bloqueio somente-leitura nem limites de plano; webhook do Stripe responde 404. White-label continua seguindo o plano da organização.
- Para ligar: `BILLING_ENABLED="true"` no `.env` (testes de cobrança do Playwright só rodam assim; os unitários sempre ligam).

## Currículo (o site vem primeiro)
- 10 mundos em 3 níveis (`content/trilhas/{basico,intermediario,avancado}.ts`). Toda habilidade é ensinada e verificada NO EDITOR DO SITE; o PictoBlox aparece só em missões `optional: true` (“Leve para o PictoBlox”), que nunca bloqueiam a trilha.
- Não mencionar robótica nem IA no conteúdo (o teste de conteúdo confere).
- Projetos do editor: `src/lib/blocks/project.ts` (vários atores + palco + variáveis globais); motor em `interpreter.ts` (`World`: teclas, cliques, mensagens, clones, sons). Biblioteca original de personagens/cenários/sons em `library.ts` + desenhos em `components/editor/art.ts`.
- Lições de jogos usam `starter: game({...})` (de `src/lib/blocks/build.ts`) e podem simular teclas/cliques na verificação (`checks.inputs`).
- `tests/unit/content.test.ts` exige: guia do professor em toda lição, solução de referência com 3 estrelas e que o projeto inicial NÃO passe sem o aluno fazer nada.
- Depois de mudar o schema do Prisma, REINICIE o `npm run dev` (ele mantém o client antigo em memória).

## Game Jams (julgamento cego)
- Fase da jam vem do relógio do servidor (`jamPhase` em `src/lib/jams.ts`), nunca é gravada. Entregas só entre `startsAt` e `endsAt`.
- `JamEntry` não aponta para equipe/escola; o vínculo fica em `JamEntryOrigin`. Funções do jurado em `src/lib/dal/jams.ts` NUNCA selecionam `origin`, equipe, escola, alunos ou nomes de arquivo. Origem só aparece no resultado (fase ENCERRADA).
- Arquivos: limpos em `src/lib/jam-files.ts` (meta do .sb3, metadados de PDF/.docx) e guardados com chave aleatória em `src/lib/storage.ts` (`.data/uploads` no dev; trocar por bucket privado do Supabase em produção). Download só por `/jams/arquivo/[entryId]/[kind]`, com nome `projeto-CODIGO.sb3`.
- Quem cria jams: SUPER_ADMIN ou usuário com `canOrganizeJams` (o dono concede na página da escola em /plataforma).
- Categorias por ano escolar (2º–9º, `JamCategory`): na inscrição cada aluno tem `schoolYear`; a equipe precisa caber numa faixa (`categoryFor`). Ranking e prêmios são por categoria; a categoria aparece ao jurado (não identifica a escola).
- O e2e `fase8.spec.ts` move as datas da jam direto no banco para passar pelas fases.

## White-label (fase 10)
- `/escola/marca` (só ORG_ADMIN, recurso `white_label` do plano): nome, cores, logo/favicon, remetente e email de suporte, esconder “com tecnologia”. Prévia ao vivo.
- Cores: a principal precisa de 3:1 contra o branco (`isAcceptablePrimaryColor`); a de destaque só precisa de texto legível sobre ela. As cores dos blocos (Scratch) nunca mudam.
- Imagens de marca: só PNG/JPG (checados pelos bytes; SVG proibido), até 1 MB, servidas em `/marca/arquivo/<uuid>` com `Content-Security-Policy: default-src 'none'`.
- Domínio próprio: `src/lib/domain-rules.ts` (validação) + `src/lib/domains.ts` (Vercel API se configurada, senão checagem de DNS). Em dev, domínios `.test`/`.localhost` verificam sem DNS.
- Emails: `src/lib/email.ts` (`sendEmail` + `emailBrandFor`), modelo puro em `email-template.ts`. Sem `RESEND_API_KEY` em dev → `.data/outbox/*.json`.
- Certificados: `/certificados/<trilha>` (aluno) e `?aluno=<id>` (professor/coordenação); só sai com todas as lições obrigatórias concluídas. PDF em `src/lib/certificate.ts` (pdf-lib, fontes WinAnsi).

## Produção (Vercel + Supabase)
- Site: https://blocos-two.vercel.app (projeto Vercel `blocos`, região gru1). Banco e arquivos: projeto Supabase `blocos` (São Paulo), bucket privado `blocos-arquivos`.
- Segredos de produção ficam SÓ em `.env.prod` (ignorado pelo git) e nas variáveis da Vercel. Nunca exibir valores.
- Comandos contra produção usam `DOTENV_CONFIG_PATH=.env.prod`:
  - migrações: `DOTENV_CONFIG_PATH=.env.prod npx prisma migrate deploy` (o build da Vercel também roda `prisma migrate deploy`)
  - currículo/contas: `DOTENV_CONFIG_PATH=.env.prod SEED_DEMO=minimal npx tsx prisma/seed.ts` (idempotente; NUNCA rodar sem SEED_DEMO em produção)
  - variáveis na Vercel: `node .vercel/push-env.cjs` (lê o .env.prod sem mostrar)
- Deploy: `vercel deploy --prod --yes` (ou push no master, depois de ligar o GitHub na Vercel).
- Contas em produção: dono (ADMIN_EMAIL) + teste: coordenacao@demo.blocos, professor@demo.blocos, aluno na turma TESTE1 (senha DEMO_PASSWORD).
