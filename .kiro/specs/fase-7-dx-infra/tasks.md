# Implementation Plan: `fase-7-dx-infra`

## Overview

Decomposição executável do `design.md` desta fase. As tarefas instalam a pipeline de CI, produzem documentação canônica de variáveis de ambiente e Docker, definem convenção de ADRs, criam o changelog, registram o type-safety baseline e (em ou após 2026-06-13) executam o cleanup de `src/lib/queries.ts` em coordenação com a fase-3.

Restrições importantes:

- **Sem alterações em código de aplicação** além do cleanup de `src/lib/queries.ts` e (se opção A escolhida) `src/lib/services/discover.service.pbt.ts`. Qualquer outra mudança em `src/**` vira `OutOfScopeFinding` para fase-5-ux ou fase-3-followup.
- **Sem testes novos**. A pipeline executa os testes existentes (172 da fase-2/3/4); não adiciona.
- **Sem alteração em `prisma/schema.prisma`**, `next.config.ts`, `eslint.config.mjs`, `package.json > dependencies` (devDependencies fora do escopo), `docker-compose.yml`, primitivos da fase-4. Apenas leitura.
- **Cleanup `queries.ts` somente em ou após 2026-06-13**. Se rodar antes, marcar como `pendente`.
- **Idioma pt-BR** em todos os documentos do spec-filho e em `docs/adr/*`, `docs/env.md`, `docs/docker.md`, `CHANGELOG.md`.
- **AGENTS_Rule não se aplica**: a fase NÃO toca APIs do Next.js. Ver `requirements.md > §4`.

Esta fase **não produz** property tests (cf. `design.md > Testing Strategy`). Nenhuma tarefa marcada com `*`.

## Tasks

- [x] 1. Validar §4 AGENTS_Rule e baseline
  - [x] 1.1 Confirmar §4 AGENTS_Rule = `n/a`
    - Ler `requirements.md > §4` e confirmar que a linha única `> n/a — fase não toca APIs do Next.js.` está presente
    - Confirmar que nenhum dos artefatos produzidos por esta fase toca APIs do Next.js (CI YAML, docs, ADRs, changelog, cleanup TS)
    - Se durante a execução algo exigir tocar API do Next.js, registrar como `OutOfScopeFinding` em §3 (regra dura E5 do master)
    - _Requirements: 9.2_

  - [x] 1.2 Inventariar baseline real no momento da execução
    - Re-rodar `npm run lint` e capturar contagem atual de problems/errors/warnings (registrar em `dx-conventions.md > §1 > Estado do lint herdado`)
    - Re-rodar `[regex]::Matches` sobre `src/**/*.{ts,tsx}` com pattern `:\s*any\b|\bas\s+any\b|<any>` e capturar count atual de `any` (registrar em `dx-conventions.md > §6 Type-safety baseline`)
    - Confirmar ausência de `.github/workflows/`, `docs/adr/`, `CHANGELOG.md` (`Test-Path` retorna `False`)
    - Confirmar estado de `src/lib/queries.ts` (header `@deprecated 2026-05-30 — remoção planejada após 2026-06-13` presente; 27 re-exports + helpers JUSTIFICADO)
    - Listar variáveis em `.env.example` e cruzar com `process.env.X` em `src/**` para identificar variáveis "fantasma"
    - _Requirements: 5.2, 5.3, Item 1 do §2 Revalidação_

  - [x] 1.3 Criar scaffold de `dx-conventions.md`
    - Criar `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-7-dx-infra\dx-conventions.md`
    - Seções vazias com cabeçalhos: `§1 CI Pipeline`, `§2 Docker doc`, `§3 Env vars doc`, `§4 Queries cleanup`, `§5 ADRs`, `§6 Type-safety baseline`, `§7 Changelog`, `§8 Smoke checks finais`
    - Anexar inventário da Tarefa 1.2 nas seções correspondentes (§1 lint, §6 any)
    - _Requirements: Saída desta fase_

- [ ] 2. Wave CI Pipeline
  - [x] 2.1 Decidir versão de Node para a CI
    - Avaliar declarar `package.json > engines.node` nesta fase OU manter sem declaração e fixar a versão direto no YAML
    - Se declarar: alinhar com versão LTS atual (Node 20 ou Node 22) e usar `node-version-file: 'package.json'` no `actions/setup-node`
    - Se não declarar: fixar `node-version: '20'` (ou outra LTS) no YAML e registrar a justificativa em ADR 0004
    - Registrar a decisão em `dx-conventions.md > §1 CI Pipeline > Versão do Node`
    - _Requirements: 8.3_

  - [x] 2.2 Decidir tolerância de lint herdado
    - Re-rodar `npm run lint` (referência: Tarefa 1.2) e contar errors herdados em arquivos de UX/painel
    - Avaliar 3 opções (cf. `design.md > Components and Interfaces > 1`):
      - **Opção A (bloquear)**: CI vermelha até fase-5 corrigir. Aceitável se houver banda da fase-5 paralela e os errors caírem rapidamente
      - **Opção B (`continue-on-error: true`)**: lint roda mas não bloqueia merge. Sustentável a curto prazo; perde gate semântico
      - **Opção C (lint apenas em arquivos modificados)**: usar `npx eslint --max-warnings 0 $(git diff --name-only origin/master...HEAD | grep -E '\\.(ts|tsx|js|jsx|mjs)$')` ou ferramenta equivalente. Mantém gate em código novo
    - Tomar a decisão e registrar em `dx-conventions.md > §1 CI Pipeline > Tolerância de lint herdado`
    - _Requirements: 1.5_

  - [x] 2.3 Criar `.github/workflows/ci.yml`
    - Criar diretório `.github/workflows/` na raiz do repositório
    - Criar `ci.yml` conforme esboço de `design.md > Components and Interfaces > 1`:
      - `name: CI`
      - `on: push: [master, main]`, `pull_request: [master, main]`
      - 1 job `build-test` com `runs-on: ubuntu-latest`, `timeout-minutes: 15`
      - Steps: `actions/checkout@vN`, `actions/setup-node@vN` com cache `npm`, `npm ci`, `npm run lint` (com tratamento conforme Tarefa 2.2), `npx tsc --noEmit`, `npm run test`
    - Aplicar versões de actions estáveis (`@v4` recomendado em 2026 para `checkout` e `setup-node` — confirmar na execução)
    - _Requirements: 1.2, 1.3, 1.4, 1.6, 8.2, 8.4_

  - [x] 2.4 Validar YAML localmente
    - Validar sintaxe YAML (qualquer parser; PowerShell `ConvertFrom-Yaml` se disponível, ou inspeção manual)
    - Confirmar que o YAML não usa `cd` (proibido por convenção do orquestrador) e que todos os caminhos são relativos ao checkout
    - Confirmar que cada step tem `name` em pt-BR (ou inglês curto idiomático para steps de actions)
    - _Requirements: 1.4_

  - [ ] 2.5 Anexar evidência da primeira run da CI
    - Após o commit de `.github/workflows/ci.yml`, capturar link da primeira run (no GitHub Actions) ou screenshot
    - Registrar em `dx-conventions.md > §1 CI Pipeline > Primeira run` o resultado de cada estágio (✅/❌) e tempo total
    - Se a CI quebrar conforme tolerância decidida em Tarefa 2.2 (esperado em Opção A), registrar como esperado e referenciar ADR 0004
    - _Requirements: 1.7_

- [x] 3. Wave Docker doc
  - [x] 3.1 Decidir localização da Docker doc
    - Avaliar `docs/docker.md` separado vs seção `## Docker (Postgres de dev)` em `README.md`
    - Decisão preferida: `docs/docker.md` (mantém README enxuto)
    - Registrar a decisão em `dx-conventions.md > §2 Docker doc > Localização` e em ADR 0005
    - _Requirements: 2.3_

  - [x] 3.2 Criar `docs/docker.md`
    - Criar diretório `docs/` na raiz se ainda não existir (decisão consistente com Wave 4 e Wave 7)
    - Criar `docs/docker.md` conforme esboço de `design.md > Components and Interfaces > 2`:
      - Visão geral (compose provê apenas Postgres, NÃO a app)
      - Tabela de configuração do serviço `db` (porta, volume, vars, restart)
      - Comando de subida (`docker compose up -d db`)
      - Como conectar via Prisma (`DATABASE_URL` canônica `postgresql://postgres:masterkey@localhost:5432/privello?schema=public`)
      - Comandos de teardown (sem perder dados / destrutivo)
      - Notas (compose NÃO sobe a app; rotacionar `masterkey` em ambientes além do laptop)
    - **NÃO** modificar `docker-compose.yml` (apenas leitura)
    - _Requirements: 2.2, 2.4_

  - [x] 3.3 Adicionar link curto no README
    - Adicionar linha em `README.md` apontando para `docs/docker.md` (ex.: `Para subir o Postgres de dev, ver [docs/docker.md](./docs/docker.md).`)
    - Manter o resto do README inalterado
    - _Requirements: 2.3_

  - [x] 3.4 Verificar discrepâncias entre `docker-compose.yml` e a doc
    - Cruzar cada campo da tabela em 3.2 com `docker-compose.yml:1-15`
    - Se houver discrepância, registrar como `OutOfScopeFinding` em `requirements.md > §3` e propor commit no master spec (não absorver correção do compose nesta fase)
    - _Requirements: 2.5_

- [x] 4. Wave Env vars doc
  - [x] 4.1 Decidir localização da Env vars doc
    - Avaliar `docs/env.md` separado vs seção `## Variáveis de ambiente` em `README.md`
    - Decisão preferida: `docs/env.md` (consistente com `docs/docker.md`; mantém escopo claro)
    - Registrar a decisão em `dx-conventions.md > §3 Env vars doc > Localização` e em ADR 0005 (mesmo ADR que cobre a Docker doc)
    - _Requirements: 3.6_

  - [x] 4.2 Inventariar variáveis fantasma
    - Re-rodar `grep_search` em `src/**/*.{ts,tsx}` por `process\.env\.[A-Z_][A-Z0-9_]*` e listar todas as variáveis encontradas
    - Cruzar com `.env.example` para identificar as variáveis "fantasma" (lidas pelo código mas não documentadas)
    - Confirmar que pelo menos `NODE_ENV`, `PRISMA_DEBUG_QUERIES`, `NEXTAUTH_URL`, `MP_WEBHOOK_SECRET`, `CI` estão fora do `.env.example`
    - Documentar a lista final em `dx-conventions.md > §3 Env vars doc > Inventário`
    - _Requirements: 3.4_

  - [x] 4.3 Criar `docs/env.md`
    - Criar `docs/env.md` conforme esboço de `design.md > Components and Interfaces > 3`:
      - Tabela canônica com 4 colunas: `Variable | Description | Example | Environment`
      - 16 entradas de `.env.example` (auth, dev, cron, images, db, email, MP)
      - 5 entradas adicionais (`NODE_ENV`, `PRISMA_DEBUG_QUERIES`, `NEXTAUTH_URL`, `MP_WEBHOOK_SECRET`, `CI`)
      - Seção `Notas` cobrindo legado de `NEXTAUTH_URL`, comportamento dev/prod de `MP_WEBHOOK_SECRET`, opt-in de `PRISMA_DEBUG_QUERIES`
      - Seção `Cross-references` apontando para `nextauth-prod.md > §2`, `metricas-baseline.md > §2.1`, `.env.example`, `next.config.ts`, `src/lib/security/dev-auth.ts`
    - Cada `Description` em pt-BR, cada `Example` realista (sem segredos reais — apenas placeholders ou comandos de geração)
    - _Requirements: 3.2, 3.3, 3.7, 3.8_

  - [x] 4.4 Decidir atualizar `.env.example` com variáveis fantasma
    - Para cada variável fantasma listada em 4.2, decidir: (a) adicionar a `.env.example` com placeholder e comentário, ou (b) deixar fora explicitamente
    - Recomendação do design: adicionar `PRISMA_DEBUG_QUERIES` e `MP_WEBHOOK_SECRET`; deixar `NEXTAUTH_URL` fora (alias legado, não introduzir em ambientes novos); `NODE_ENV` e `CI` são setados pelo runtime/CI, não vão em `.env.example`
    - **Caso adicione**: editar `.env.example` (única alteração permitida nesta fase fora dos novos arquivos) com placeholder + comentário em pt-BR; preservar a estrutura existente
    - **Caso não adicione**: registrar a decisão em `dx-conventions.md > §3 Env vars doc > Decisão sobre .env.example`
    - _Requirements: 3.5_

  - [x] 4.5 Adicionar link curto no README
    - Adicionar linha em `README.md` apontando para `docs/env.md`
    - Manter o resto do README inalterado
    - _Requirements: 3.6_

- [ ] 5. Wave Cleanup queries.ts (condicional à janela 2026-06-13) — **PENDENTE até 2026-06-13** (data de execução: 2026-05-16, antes da janela). Ver `dx-conventions.md > §4 Queries cleanup > Status`.
  - [ ] 5.1 Verificar se a fase está dentro da janela — **DONE: marcada como pendente até 2026-06-13**
    - Confirmar a data atual de execução (`Get-Date` ou similar)
    - Se a data for **antes de 2026-06-13**: marcar Wave 5 inteira como `pendente até 2026-06-13` em `dx-conventions.md > §4 Queries cleanup > Status` e prosseguir para Wave 6 (a fase pode atingir Done com EAR 8.4 marcado como pendente, com nota explícita no Phase Card do master)
    - Se a data for **em ou após 2026-06-13**: prosseguir com 5.2
    - _Requirements: 4.2, 4.4_

  - [ ] 5.2 Investigar viabilidade da Opção A (cleanup integral)
    - Ler `src/lib/services/discover.service.pbt.ts` integralmente
    - Avaliar se a Property 1 pode ser expressa como snapshot estático sem perda de cobertura
    - Estimar tamanho do snapshot (linhas de código necessárias para cobrir as combinações `(filters, sort)` cobertas hoje pelo PBT)
    - Se snapshot for compacto (≤ 200 linhas) e cobrir todos os caminhos: prosseguir com 5.3 (Opção A)
    - Se snapshot for impraticável (> 500 linhas, ou perde regressões reais): pular para 5.5 (Opção B)
    - Registrar a investigação em `dx-conventions.md > §4 Queries cleanup > Investigação Opção A`
    - _Requirements: 4.3_

  - [ ] 5.3 [Opção A] Migrar Property 1 para snapshot
    - Substituir em `src/lib/services/discover.service.pbt.ts` o import dos helpers de `@/lib/queries` por uma constante local com sequência esperada para cada combinação
    - Manter a propriedade declarada (paridade SQL ↔ memória) — apenas trocar o oráculo
    - Validar com `npx vitest --run src/lib/services/discover.service.pbt.ts` que o teste continua passando
    - _Requirements: 4.3_

  - [ ] 5.4 [Opção A] Remover `src/lib/queries.ts`
    - Confirmar que nenhum import remanescente referencia `@/lib/queries` (`grep_search` em `src/**` por `from "@/lib/queries"`)
    - Se houver: registrar como `OutOfScopeFinding` (consumidor não migrado pela fase-3) e parar a Opção A
    - Se zero imports: deletar `src/lib/queries.ts`
    - Atualizar ADR 0003 com `Status: Substituído por <ADR de remoção ou nota em 0003>`
    - _Requirements: 4.3_

  - [ ] 5.5 [Opção B] Manter helpers JUSTIFICADO
    - Editar `src/lib/queries.ts` removendo os 27 re-exports (linhas 22-72), mantendo apenas:
      - Header de docstring atualizado (remover `@deprecated 2026-05-30 — remoção planejada após 2026-06-13`; adicionar nova justificativa apontando para ADR 0003 atualizado e nova janela de revisão, ex.: `2026-12-31`)
      - Helpers `sortProfileCards`, `finalizeDiscoverOrder`, constante `profileCardInclude`, tipo `ProfileCardPayload` (mantidos)
    - Confirmar que nenhum import remanescente em `src/**` referencia o que foi removido
    - Atualizar ADR 0003 com `Status: Aceito (revisão em <nova data>)` e seção `Consequências > Negativas` listando o débito técnico contínuo
    - _Requirements: 4.3_

  - [ ] 5.6 Validar smoke checks pós-cleanup
    - Rodar `npx tsc --noEmit` e capturar saída (esperado exit 0)
    - Rodar `npm run test` e confirmar que Property 1 (`discover.service.pbt.ts`) continua verde
    - Rodar `npm run build` (com `AUTH_URL` no shell em prod-mode) e confirmar exit 0
    - Anexar logs em `dx-conventions.md > §4 Queries cleanup > Smoke checks`
    - _Requirements: 4.5, 4.6_

- [x] 6. Wave Type-safety baseline
  - [x] 6.1 Registrar contagem atual de `any`
    - Re-rodar o comando canônico de `design.md > Components and Interfaces > 7`:
      ```powershell
      $total = 0; Get-ChildItem -Path src -Recurse -Include *.ts, *.tsx -File | ForEach-Object {
        $content = [System.IO.File]::ReadAllText($_.FullName)
        $regex = [regex]::new(':\s*any\b|\bas\s+any\b|<any>')
        $m = $regex.Matches($content)
        if ($m.Count -gt 0) { $total += $m.Count; Write-Host "$($_.FullName.Substring($PWD.Path.Length+1)): $($m.Count)" }
      }
      Write-Host "===TOTAL=== $total"
      ```
    - Anexar saída literal em `dx-conventions.md > §6 Type-safety baseline`
    - Registrar data da medição (formato `YYYY-MM-DD`)
    - _Requirements: 5.2, 5.3_

  - [x] 6.2 Decidir necessidade de plano de redução
    - Se contagem ≤ 5: registrar a contagem e a data; **não** produzir plano formal de redução. EAR 8.5 colapsa
    - Se contagem > 5: produzir tabela `path:linha` de cada ocorrência + meta numérica de redução (ex.: 50% até X, 100% até Y) + critério de aceite por arquivo (substituição por tipo concreto, `unknown` + narrowing, ou `@ts-expect-error` justificado)
    - Registrar a decisão (com ou sem plano) em `dx-conventions.md > §6 Type-safety baseline > Decisão`
    - _Requirements: 5.4, 5.5_

  - [x] 6.3 Confirmar `tsconfig.json > strict: true`
    - Confirmar leitura de `tsconfig.json:5` (`"strict": true`) — pré-condição para que count de `any` seja confiável
    - **NÃO** alterar `tsconfig.json` nesta fase
    - Registrar a confirmação em `dx-conventions.md > §6 Type-safety baseline > Pré-condições`
    - _Requirements: 5.6_

- [x] 7. Wave ADRs convention
  - [x] 7.1 Criar `docs/adr/` e modelo `0001-template.md`
    - Criar diretório `docs/adr/`
    - Criar `docs/adr/0001-template.md` em pt-BR conforme esboço de `design.md > Components and Interfaces > 4`:
      - Cabeçalho `# ADR NNNN — <título curto>`
      - Campos: `Status` (Proposto/Aceito/Substituído por NNNN/Rejeitado), `Data` (ISO-8601)
      - Seções: `Contexto`, `Decisão`, `Consequências` (Positivas/Negativas/Neutras), `Referências`
    - _Requirements: 6.2, 6.3, 6.4_

  - [x] 7.2 Documentar regras de numeração e status
    - No `0001-template.md`, adicionar comentário ou seção `Notas para uso` explicando: numeração sequencial sem reuso, 4 dígitos, status `Substituído por NNNN` quando ADR é substituído (não deletado)
    - Registrar essas regras também em `dx-conventions.md > §5 ADRs > Convenção`
    - _Requirements: 6.5_

  - [x] 7.3 Criar ADR 0002 — Vitest + fast-check
    - Criar `docs/adr/0002-vitest-fast-check.md`
    - Status: `Aceito`. Data: `2026-03-14` (data original da decisão na fase-2)
    - Contexto: zero testes unitários antes; precisa de runner ESM-first com baixa configuração; fase-2 do master spec
    - Decisão: Vitest 4.1.6 + fast-check 4.8.0 + `@fast-check/vitest` 0.4.1, pinados, `*.test.ts`/`*.pbt.ts` co-localizados
    - Consequências: positivas (paralelismo nativo, API compatível com Jest, suporte ESM); negativas (versão pinada precisa de PR dedicado para upgrade); neutras (Playwright continua isolado em `tests/e2e/`)
    - Referências: `c:/.../fase-2-testes/design.md > Decisões de design importantes`, `c:/.../fase-2-testes/testing-conventions.md`
    - _Requirements: 6.6_

  - [x] 7.4 Criar ADR 0003 — `queries.ts` em estado híbrido
    - Criar `docs/adr/0003-queries-ts-deprecated.md`
    - Status: `Aceito (revisão em 2026-06-13)`. Data: `2026-05-17`
    - Contexto: 27 funções migradas para `services/`; helpers `sortProfileCards`/`finalizeDiscoverOrder`/`profileCardInclude`/`ProfileCardPayload` permanecem como oráculo da Property 1
    - Decisão: estado híbrido (a) re-exports `@deprecated 2026-05-30` + (b) helpers JUSTIFICADO até janela de remoção; cleanup pós-2026-06-13 escolhe entre opção A (remoção integral, Property 1 → snapshot) ou opção B (manter com nova justificativa)
    - Consequências: positivas (compatibilidade durante a janela; PBT não bloqueia migração); negativas (débito técnico contínuo até cleanup); neutras (Property 1 testa paridade SQL ↔ JS)
    - Referências: `c:/.../fase-3-backend/metricas-baseline.md > §5 Decisões`, `src/lib/queries.ts:1-22`, `src/lib/services/discover.service.pbt.ts`
    - **Atualizar este ADR após Wave 5** (Opção A escolhida → status `Substituído por <novo>`; Opção B escolhida → status `Aceito (revisão em <nova data>)`)
    - _Requirements: 6.6, 4.3_

  - [x] 7.5 Criar ADR 0004 — Pipeline de CI
    - Criar `docs/adr/0004-ci-pipeline.md`
    - Status: `Aceito`. Data: `<data da execução desta fase>`
    - Contexto: `.github/workflows/` ausente antes desta fase; lint herdado tem ~20–28 errors em código de UX/painel pertencente à fase-5
    - Decisão: GitHub Actions, 1 job + 5 steps (checkout, setup-node com cache npm, npm ci, lint, tsc, test); tolerância de lint herdado segundo opção <A/B/C escolhida em Tarefa 2.2>
    - Consequências: positivas (gate semântico em PRs novos; tempo curto pós-cache); negativas (lint pode ficar vermelho até fase-5 corrigir; depende da decisão de tolerância); neutras (tests rodam sem banco e sem rede em ≤ 60s, contrato da fase-2)
    - Referências: `c:/.../fase-7-dx-infra/requirements.md > Requirement 1.5`, `c:/.../handoff.md > Smoke checks finais`, `c:/.../fase-2-testes/testing-conventions.md > §8`, `c:/.../fase-4-design-system/tokens.md > Contrato com a CI da Fase 7`
    - _Requirements: 6.6, 1.5_

  - [x] 7.6 Criar ADR 0005 — Localização de docs
    - Criar `docs/adr/0005-env-doc-localizacao.md`
    - Status: `Aceito`. Data: `<data da execução desta fase>`
    - Contexto: precisa de localização única para `docs/env.md` e `docs/docker.md`; alternativa é seção em `README.md`
    - Decisão: `docs/env.md` e `docs/docker.md` separados; README ganha apenas links curtos
    - Consequências: positivas (README enxuto; escopo claro por documento); negativas (1 saltinho extra para o dev novo); neutras (consistente com convenção de outros projetos Next/TS)
    - Referências: `c:/.../fase-7-dx-infra/requirements.md > Requirement 2.3, 3.6`
    - _Requirements: 6.6_

  - [x] 7.7 Listar ADRs criados em `dx-conventions.md`
    - Em `dx-conventions.md > §5 ADRs > Lista`, registrar tabela com `NNNN | Título | Status | Data` para cada ADR criado (0001 template + 0002, 0003, 0004, 0005)
    - Confirmar regra: ADRs novos a partir desta fase obrigam substituir prosa em `design.md` futuros (`design.md` referencia o ADR, não duplica)
    - _Requirements: 6.7_

- [x] 8. Wave Changelog
  - [x] 8.1 Criar `CHANGELOG.md` na raiz
    - Criar `c:\Users\edulanzarin\Documents\Dev\privello\CHANGELOG.md`
    - Cabeçalho com nota sobre Keep a Changelog v1.1.0 e SemVer 2.0 (links para versões pt-BR)
    - Seção `[Unreleased]` no topo
    - _Requirements: 7.2, 7.3, 7.4_

  - [x] 8.2 Popular seção `[Unreleased]` cobrindo fases 1–4 + 7
    - Subseção `Added`: CI pipeline, docs/env.md, docs/docker.md, docs/adr/, CHANGELOG.md (esta fase); camada de services 9 entries (fase-3); Vitest 4.1.6 + fast-check 4.8.0 + `@fast-check/vitest` 0.4.1, 172 testes (fase-2/3/4); tokens semânticos `--privello-warning`/`--privello-danger`/`--privello-blue`, escala tipográfica explícita (fase-4); primitivos `Dropdown` e `useFocusTrap` (fase-4); CSP Report-Only e HSTS (fase-1); rate limiting login/upload/wa-click/comments/stories (fase-1); validação Zod em Server Actions e API Routes (fase-1); `/api/dev/*` autenticado e `/api/cron/*` por header (fase-1); whitelist de hosts em `images.remotePatterns` (fase-1); `.env.example` com 16 variáveis (fase-1); lint anti-regressão `no-restricted-syntax` (fase-4)
    - Subseção `Changed`: `src/lib/queries.ts` refatorado para híbrido (fase-3); `src/lib/auth.ts` guard `AUTH_URL` em prod (fase-1); `next.config.ts` headers + remotePatterns (fase-1); 24 consumidores migrados queries→services (fase-3); 7 rotas migradas para `revalidate=N` (fase-3); ~50 arquivos migrados para tokens (fase-4)
    - Subseção `Deprecated`: re-exports de `@/lib/queries` (`@deprecated 2026-05-30`)
    - Subseção `Removed`: nenhum item formal nas fases 1–4 (cleanup pós-2026-06-13 vai aparecer na próxima entrada)
    - Subseção `Fixed`: bug iPhone via LAN (`trustHost: true`)
    - Subseção `Security`: HSTS + CSP Report-Only + dev/cron auth + rate limiting + whitelist + Zod
    - Cf. esboço completo em `design.md > Components and Interfaces > 5`
    - _Requirements: 7.5_

  - [x] 8.3 Declarar regra de manutenção
    - Adicionar nota no topo do `CHANGELOG.md` ou em `dx-conventions.md > §7 Changelog > Convenção`: "Entradas futuras acompanham o commit que entrega a mudança — não há tarefa de 'atualizar changelog' separada"
    - Confirmar Non-Goal: automação de geração (release-please, semantic-release, changesets) está fora desta fase
    - _Requirements: 7.6, 7.7_

- [ ] 9. Wave Smoke checks finais
  - [ ] 9.1 Rodar `npm run lint` final
    - Esperado: comportamento alinhado com `handoff.md > Smoke checks finais (pós fase-3 + fase-4)` (~67–75 problems; 20–28 errors herdados; **zero erros novos** introduzidos por esta fase)
    - Se contagem aumentou em relação ao handoff: investigar e registrar como `OutOfScopeFinding` para fase paralela responsável
    - Anexar log em `dx-conventions.md > §8 Smoke checks finais > 9.1 npm run lint`
    - _Requirements: Saída desta fase_

  - [ ] 9.2 Rodar `npx tsc --noEmit` final
    - Esperado: exit 0
    - Se quebrar: investigar arquivo apontado; pode ser efeito do cleanup `queries.ts` da Wave 5 — corrigir antes de prosseguir
    - Anexar log em `dx-conventions.md > §8 Smoke checks finais > 9.2 tsc --noEmit`
    - _Requirements: Saída desta fase_

  - [ ] 9.3 Rodar `npm run test` final
    - Esperado: 172+ testes passando (a contagem pode mudar se Wave 5 Opção A migrou Property 1 para snapshot)
    - Se quebrar: investigar — pode ser regressão do cleanup
    - Anexar log em `dx-conventions.md > §8 Smoke checks finais > 9.3 npm run test`
    - _Requirements: 4.5, Saída desta fase_

  - [ ] 9.4 Rodar `npm run build` final
    - Esperado: exit 0 (com `AUTH_URL` no shell em prod-mode, conforme `handoff.md > Observações operacionais`); 71 rotas compiladas (pode variar)
    - Se quebrar: investigar — pode ser regressão do cleanup
    - Anexar log em `dx-conventions.md > §8 Smoke checks finais > 9.4 npm run build`
    - **Importante**: `npm run build` NÃO está incluído na CI desta fase (cf. `design.md > Components and Interfaces > 1`); este smoke roda localmente para validar que a entrega não quebra build
    - _Requirements: Saída desta fase_

  - [ ] 9.5 Confirmar inalteração de arquivos protegidos
    - Confirmar que `prisma/schema.prisma`, `next.config.ts`, `eslint.config.mjs`, `docker-compose.yml` não foram alterados nesta fase (apenas leitura)
    - Confirmar que primitivos da fase-4 (`src/components/ui/dropdown.tsx`, `src/components/ui/modal.tsx`, `src/components/ui/switch.tsx`, `src/lib/hooks/use-focus-trap.ts`, `src/lib/hooks/use-file-upload.ts`) não foram alterados
    - Confirmar que `src/app/**` e `src/components/**` não foram alterados (exceto pelo cleanup `queries.ts` se Wave 5 rodou — mas esse arquivo é em `src/lib/`, não em `src/app/` nem `src/components/`)
    - Registrar a confirmação em `dx-conventions.md > §8 Smoke checks finais > 9.5 Inalteração de arquivos protegidos`
    - _Requirements: Non-Goals 4, 5, 7_

- [ ] 10. Saída desta fase
  - [ ] 10.1 Validar saída
    - Todos os 9 Requirements de `requirements.md` têm evidência (path do arquivo, log de smoke, link da run de CI ou referência em `dx-conventions.md`) anexada
    - `.github/workflows/ci.yml` existe e a primeira run da CI completou os 3 estágios
    - `docs/env.md` cobre 20+ entradas (16 de `.env.example` + variáveis fantasma + `CI`)
    - `docs/docker.md` cobre serviços, portas, volumes, variáveis e comandos
    - `docs/adr/0001-template.md` + ADRs 0002, 0003, 0004, 0005 existem
    - `CHANGELOG.md` existe na raiz no formato Keep a Changelog v1.1.0 com seção `[Unreleased]` cobrindo fases 1–4 + 7
    - `dx-conventions.md` cobre §1 a §8 com conteúdo concreto
    - Wave 5 (Cleanup `queries.ts`): ou implementada (Opção A ou B) com smoke checks verdes; ou marcada como `pendente até 2026-06-13` com nota explícita
    - Type-safety baseline registrado: contagem atual + comando reproduzível em `dx-conventions.md > §6`
    - Seção `OutOfScopeFinding` em `requirements.md > §3` está vazia OU cada linha aponta commit no master spec
    - Smoke checks finais: `npm run lint` (esperado idêntico ao handoff), `npx tsc --noEmit` exit 0, `npm run test` 172+ testes, `npm run build` exit 0
    - Arquivos protegidos não alterados (cf. Tarefa 9.5)
    - _Requirements: Saída desta fase_

  - [ ] 10.2 [orquestrador] Atualizar Phase Card no master `requirements.md`
    - **Esta tarefa é executada pelo orquestrador, não pelo executor da fase**
    - `state: InProgress` → `state: Done`
    - Adicionar `doneAt` ISO-8601 no formato `YYYY-MM-DDTHH:MM:SSZ`
    - Manter `child_spec_path` apontando para esta pasta
    - Se Wave 5 ficou como `pendente até 2026-06-13`, adicionar nota explícita no Phase Card (`<!-- EAR 8.4 cleanup pendente até 2026-06-13. Ver dx-conventions.md > §4. -->`)
    - Nenhuma fase desta árvore depende de fase-7-dx-infra (folha do grafo, cf. `PROMOCAO.md > §5` e `handoff.md > Próximos passos`); não é necessário re-rodar Spawn-Readiness Gate
    - Atualizar `handoff.md` com a entrega desta fase (links para `.github/workflows/ci.yml`, `docs/env.md`, `docs/docker.md`, `docs/adr/`, `CHANGELOG.md`, `dx-conventions.md`)
    - _Requirements: Saída desta fase_

## Notes

- Esta fase **não produz testes novos** — a CI executa testes existentes das fases 2/3/4. Nenhuma tarefa marcada com `*`.
- A Wave 5 (Cleanup `queries.ts`) é **condicional** à janela 2026-06-13. Se rodar antes, o cleanup é postergado e a fase pode atingir Done com nota explícita no Phase Card do master.
- A decisão de tolerância de lint herdado (Tarefa 2.2) depende do estado real do lint no momento da execução. Pode mudar se fase-5-ux rodou em paralelo e corrigiu errors.
- Tarefas que tocam o mesmo arquivo (ex.: `dx-conventions.md` em todas as Waves; `README.md` em 3.3 e 4.5; `docs/` criação em 3.2 e 4.3 e 7.1; ADR 0003 em 7.4 e Wave 5) ficam em ondas distintas no grafo abaixo para evitar conflito de edição.
- Toda alteração que extrapole o escopo desta fase **NÃO** é absorvida — vira `OutOfScopeFinding` em `requirements.md > §3` com commit no master spec (regra dura E4 do master).
- Automação de changelog (release-please, semantic-release, changesets) é Non-Goal desta fase e candidata a fase futura.
- Configuração de cobertura como hard gate é Non-Goal desta fase e candidata a fase futura.
- Esta fase é folha do grafo de dependências (cf. `PROMOCAO.md > §5`); não destrava nenhuma fase posterior.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3"] },
    { "id": 2, "tasks": ["2.1", "2.2", "3.1", "4.1"] },
    { "id": 3, "tasks": ["2.3", "3.2", "4.2"] },
    { "id": 4, "tasks": ["2.4", "3.3", "3.4", "4.3"] },
    { "id": 5, "tasks": ["4.4", "4.5"] },
    { "id": 6, "tasks": ["6.1", "6.2", "6.3"] },
    { "id": 7, "tasks": ["7.1", "7.2"] },
    { "id": 8, "tasks": ["7.3", "7.4", "7.5", "7.6"] },
    { "id": 9, "tasks": ["7.7"] },
    { "id": 10, "tasks": ["8.1"] },
    { "id": 11, "tasks": ["8.2", "8.3"] },
    { "id": 12, "tasks": ["5.1"] },
    { "id": 13, "tasks": ["5.2"] },
    { "id": 14, "tasks": ["5.3", "5.5"] },
    { "id": 15, "tasks": ["5.4"] },
    { "id": 16, "tasks": ["5.6"] },
    { "id": 17, "tasks": ["2.5"] },
    { "id": 18, "tasks": ["9.1", "9.2", "9.3", "9.4", "9.5"] },
    { "id": 19, "tasks": ["10.1"] },
    { "id": 20, "tasks": ["10.2"] }
  ]
}
```
