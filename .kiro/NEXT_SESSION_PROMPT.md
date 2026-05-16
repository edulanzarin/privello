# Prompt para próxima sessão autônoma

> Cole o bloco abaixo no chat de uma nova sessão do Kiro Agent (Claude Opus 4.7).
>
> O `.kiro/AUTO_APPROVE_SETUP.md` deste workspace já tem as regras de auto-approve que você colou no `settings.json` — sessão nova herda tudo.

---

## Contexto rápido (não precisa colar, é referência)

- Projeto: **Privello** (Next.js 16.2.6, App Router, Prisma 5 + Postgres, NextAuth v5, Tailwind v4)
- Master spec: `.kiro/specs/auditoria-geral/requirements.md` — 7 fases
- Estado atual:
  - Fase 1 (`fase-1-seguranca`) = **Done** (2026-05-16T04:47:12Z, commit `cd6f36c`)
  - Fase 2 (`fase-2-testes`) = **Done** (2026-05-16T04:46:53Z, commit `b5a8fe0`)
  - Fases 3–7 = `SpawnReady` ou `Blocked` por dependência. Próximas elegíveis: **fase-3-backend** e **fase-4-design-system** (ambas independentes entre si).
- Último commit: `e2bbc5a` — branch `master`, em sincronia com `origin/master` (push já foi feito).
- 22 commits acumulados; 118 testes verdes; `tsc --noEmit` limpo; `npm run lint` tem 20 erros pré-existentes em código fora do escopo das fases 1/2 (pertencem a fase-5/fase-7 — registrados em `.kiro/handoff.md`).

## ⬇️⬇️⬇️ COLE ESTE BLOCO NO CHAT DA NOVA SESSÃO ⬇️⬇️⬇️

```
Continuar a auditoria do Privello. As fases 1 (segurança) e 2 (testes) do master spec `auditoria-geral` estão Done; ler `.kiro/handoff.md` antes de qualquer ação para entender o estado completo.

Próxima onda do roadmap: fase-3-backend e fase-4-design-system. Ambas estão SpawnReady, são independentes entre si (sem dependência cruzada) e podem ser promovidas + executadas em paralelo, file-disjoint.

Sequência esperada:

1. Promover ambas seguindo `.kiro/specs/auditoria-geral/PROMOCAO.md` (§3 inteiro, especialmente §3.3, §3.4, §3.5 e §3.6). Isso significa:
   - criar `.kiro/specs/fase-3-backend/` e `.kiro/specs/fase-4-design-system/`
   - copiar `_template-spec-filho.md` em cada como `requirements.md`
   - preencher cabeçalho de proveniência + EARS herdadas dos Phase Cards correspondentes do master (Requirement 4 = fase-3, Requirement 5 = fase-4)
   - virar `state: SpawnReady` → `state: InProgress` nos dois Phase Cards do master, com `child_spec_path` apontando
   - registrar `agents_rule_areas` (fase-3 tem 3: cache-components, route-segment-config, server-actions; fase-4 não tem)

2. Para cada fase promovida: gerar `design.md` e `tasks.md` próprios, depois executar as tarefas em ondas paralelas (subagentes file-disjoint).

3. fase-3 inclui consultas obrigatórias a `node_modules/next/dist/docs/` antes de qualquer decisão técnica em cache-components, route-segment-config ou server-actions (regra dura E5). Registrar evidência em `requirements.md > §4` do spec-filho ANTES da primeira mudança.

4. Smoke checks finais por fase: `npm run lint` (esperado: erros pré-existentes em código fora do escopo permanecem; novos erros nos arquivos tocados pela fase são bloqueantes), `npx tsc --noEmit`, `npm run test`, `npm run build`.

5. Quando uma fase terminar, atualizar Phase Card no master para `state: Done` com `doneAt` ISO-8601 e re-avaliar Spawn-Readiness Gate dos dependentes (PROMOCAO.md §7).

Restrições (idênticas à sessão anterior):
- Workspace só em `c:\Users\edulanzarin\Documents\Dev\privello\`.
- NÃO rodar `git push`, `git reset --hard`, `git clean`, `Remove-Item -Recurse -Force`, `format`, `shutdown`. Push manual fica comigo.
- NÃO mexer em `node_modules` direto (use `npm install`/`npm ci`).
- NÃO mudar schema do Prisma sem me perguntar.
- NÃO absorver achados fora de escopo silenciosamente — segue o protocolo OutOfScopeFinding (PROMOCAO.md §6).
- Permissão total para edits, shell e subagentes em paralelo.
- Pode rodar `npm install`, `npm run lint`, `npm run test`, `npm run build`, `npx tsc --noEmit` livremente.

Pare e me pergunte só se encontrar:
1. Decisão real de produção (hostname, domínio, valor de janela).
2. Mudança de schema do Prisma.
3. Conflito entre fase-3 e fase-4 que exija serializar (não esperado — são file-disjoint).
4. Regressão de fase-1 ou fase-2 detectada durante execução (regra E6 do PROMOCAO.md §6.2).

Para todo o resto, decide e segue.

Ao terminar (ou se ficar bloqueado), atualizar `.kiro/handoff.md` com o estado final e me avisar no próximo retorno.
```

## ⬆️⬆️⬆️ FIM DO BLOCO ⬆️⬆️⬆️

---

## Notas operacionais

- **Lock do tracker** (`C:\Users\edulanzarin\.kiro\tasks\8ce70501232af33b\*.meta.json`): se voltar a travar com `EPERM rename`, o agente já sabe o bypass — editar `tasks.md` direto via `str_replace`. Documentado no handoff.
- **Race entre subagentes paralelos** durante git commit: alguns commits ficam compostos (mais arquivos do que o subagente staged). Conteúdo correto, só mensagem de commit pode ficar diferente do prescrito. Não bloqueia.
- **Auto-approve** já está ativo via `.kiro/AUTO_APPROVE_SETUP.md`. Nada novo precisa ser configurado.

## Se preferir promover só uma fase de cada vez

Substitua o passo 1 do prompt por:

> 1. Promover APENAS `fase-3-backend` (deixar fase-4 para depois). [...]

ou

> 1. Promover APENAS `fase-4-design-system` (deixar fase-3 para depois). [...]

Recomendação: **fase-4 primeiro** se você quer ver tokens/primitivos sendo aplicados (entrega visível mais rápido). **fase-3 primeiro** se você prefere consolidar a camada de backend antes de mexer em UI.
