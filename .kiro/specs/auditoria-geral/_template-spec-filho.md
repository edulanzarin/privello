<!--
Template de promoção de fase do master spec da Auditoria Geral.

Como usar:
  1. Quando uma fase (Phase Card) deste master spec atingir o estado SpawnReady,
     copie este arquivo para `.kiro/specs/{phase-id}/requirements.md`.
  2. Substitua todos os placeholders <...> pelos valores reais da fase.
  3. Apague os comentários HTML "(remover ao usar)" depois de preencher cada
     bloco. Mantenha apenas os comentários que documentam invariantes do
     processo (proveniência, AGENTS_Rule, OutOfScopeFinding).
  4. NÃO altere a ordem das quatro seções obrigatórias deste arquivo:
       (1) Cabeçalho de proveniência
       (2) Revalidação
       (3) Achados fora de escopo
       (4) Consultas a `node_modules/next/dist/docs/` (AGENTS_Rule)
     Outras seções específicas da fase (User Story, Requirements em EARS,
     Non-Goals, Glossary etc.) podem ser adicionadas depois desses quatro
     blocos, seguindo o padrão de um `requirements.md` comum do Privello.

Referência cruzada:
  - Schema dos campos: `design.md > Data Models` (Phase, OutOfScopeFinding,
    NextApiArea, ArchivedSpecRef).
  - Protocolo de Revalidação: `design.md > Components and Interfaces > Child
    Spec Bridge` e `requirements.md > Requirement 1.4`.
  - Procedimento de promoção: `PROMOCAO.md` (vizinho deste template, criado
    pela tarefa 3.2).
-->

# Requirements Document — `<fase-N-slug>`

> Spec-filho promovido a partir do master spec da Auditoria Geral.
> Master: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\requirements.md`.

---

## 1. Cabeçalho de proveniência

<!--
OBRIGATÓRIO para todo spec-filho. Sem este cabeçalho preenchido sem ambiguidade,
o spec-filho não cumpre o Requirement 9.2 do master spec
("THE Phase_Spec SHALL referenciar este master spec por caminho absoluto e o
identificador da fase").
-->

- **master_spec_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\requirements.md`
- **master_design_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\auditoria-geral\design.md`
- **phase_id**: `<fase-N-slug>` <!-- ex.: `fase-1-seguranca`, `fase-3-backend`, `fase-5-ux` -->
- **phase_title**: `<Título humano em pt-BR, idêntico ao do Phase Card no master>`
- **promoted_at**: `<YYYY-MM-DD>` <!-- data da transição SpawnReady → InProgress -->
- **child_spec_path**: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\<fase-N-slug>\`
- **bridge_contract**: `design.md > Components and Interfaces > Child Spec Bridge`

### Critérios de aceite herdados (EARS)

<!--
Liste cada AcceptanceCriterion do master spec que pertence a esta fase, com a
referência `<requirement>.<criterio>` exatamente como aparece em
`requirements.md`. Esta lista é apenas reflexo do master; novos critérios não
podem nascer aqui — eles voltam ao master via OutOfScopeFinding (seção 3).

Formato sugerido:
  - **Requirement <N>.<M>** — `<frase EARS literal copiada do master>`
-->

- **Requirement `<N>.<M>`** — `<frase EARS literal copiada do master>`
- **Requirement `<N>.<M>`** — `<frase EARS literal copiada do master>`
- **Requirement `<N>.<M>`** — `<frase EARS literal copiada do master>`

---

## 2. Revalidação

<!--
OBRIGATÓRIO sempre que o Phase Card desta fase no master spec tiver
`historical_refs` preenchido (apontando para `.kiro/specs/_archive/*`).
Para fases sem `historical_refs` (ex.: `fase-1-seguranca`), substitua todo o
conteúdo desta seção por uma única linha:

  > n/a — esta fase não herda nenhum spec arquivado.

Protocolo (ver `design.md > Components and Interfaces > Child Spec Bridge`):
  - Cada item herdado de `_archive/` é classificado em UM dos três estados:
      • `Confirmado`: ainda válido contra o código atual; vira tarefa.
      • `Resolvido`: já entregue; NÃO vira tarefa, fica registrado como
        histórico com link para commit/arquivo que comprova.
      • `Reescopado`: ainda é problema, mas em outro lugar do código; o EARS
        original é mantido e a descrição é atualizada para o alvo atual.
  - Itens marcados ✅ em `design.md > Estado de partida` entram automaticamente
    como `Resolvido` e NÃO podem ser absorvidos como tarefa.
  - Cada classificação exige `evidence` (path:linha, hash de commit ou link
    de PR) — sem evidência, o item permanece em revisão.
-->

### 2.1 `<archived_spec_path>`

<!--
Repita esta subseção uma vez para cada caminho listado em `historical_refs`
do Phase Card no master spec. Use o caminho absoluto exatamente como aparece
no master, ex.:
  c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\backend-performance-phase5
-->

- **archived_spec_path**: `<c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\_archive\nome-do-spec>`
- **scope**: `<security | testing | backend | design-system | ux | mobile | dx>` <!-- ver tipo `ArchivedSpecRef` em `design.md > Data Models` -->

#### Itens herdados

<!--
Os três blocos abaixo são modelos para os três estados possíveis. Mantenha
apenas os que se aplicarem; duplique conforme a quantidade de itens
herdados deste spec arquivado.
-->

<!-- ─── Modelo: Confirmado ──────────────────────────────────────────────── -->

- **Item**: `<descrição curta do item herdado, em pt-BR>`
- **Origem no spec arquivado**: `<arquivo.md#secao>` ou `<requirement.subitem>`
- **Estado**: `Confirmado`
- **evidence**: `<src/path/arquivo.ts:linha-linha>` <!-- ou hash de commit / link de PR que comprova que o problema persiste -->
- **Tarefa derivada**: `<frase imperativa que entrará em tasks.md do spec-filho>`

<!-- ─── Modelo: Resolvido ───────────────────────────────────────────────── -->

- **Item**: `<descrição curta do item herdado, em pt-BR>`
- **Origem no spec arquivado**: `<arquivo.md#secao>` ou `<requirement.subitem>`
- **Estado**: `Resolvido`
- **evidence**: `<src/path/arquivo.ts:linha>` ou `<commit-hash>` ou `<link-PR>` <!-- referência única que comprova a entrega já feita -->
- **Observação**: <!-- explicar em uma linha por que NÃO entra como tarefa; ex.: "coberto por `next.config.ts:12-19` desde o commit X" -->

<!-- ─── Modelo: Reescopado ──────────────────────────────────────────────── -->

- **Item**: `<descrição curta do item herdado, em pt-BR>`
- **Origem no spec arquivado**: `<arquivo.md#secao>` ou `<requirement.subitem>`
- **Estado**: `Reescopado`
- **EARS original (mantido)**: `<frase EARS herdada do spec arquivado, sem edição>`
- **Alvo atual**: `<descrição do estado atual do código onde o problema agora aparece>`
- **evidence**: `<src/path/arquivo.ts:linha-linha>` <!-- aponta para o ALVO ATUAL, não para o spec arquivado -->
- **Tarefa derivada**: `<frase imperativa que entrará em tasks.md do spec-filho>`
- **Impacto no master spec**: <!--
    Se o reescopo alterar algum critério de aceite do master spec, abrir
    update do master spec ANTES de prosseguir (cf. `design.md > Error
    Handling > E3`). Registre aqui se foi necessário e qual commit do
    master cobriu o ajuste.
  -->

---

## 3. Achados fora de escopo

<!--
OBRIGATÓRIO para todo spec-filho, mesmo que esteja inicialmente vazio.

Regra dura (cf. `design.md > Error Handling > E4`):
  Cada novo achado relevante que extrapolar o escopo desta fase é registrado
  aqui e propõe um retorno ao master spec. NUNCA é absorvido silenciosamente
  pelo spec-filho. Em nenhuma hipótese um achado fora de escopo se transforma
  em tarefa direta deste spec-filho — ele exige commit no master antes.

Schema (`design.md > Data Models > OutOfScopeFinding`):
  - discoveredIn:    Phase["id"] desta fase, ex.: `fase-3-backend`.
  - description:     descrição factual do achado, em pt-BR.
  - proposedTarget:  outro `fase-N-slug` existente OU `novo-spec-filho`.
  - evidence:        `path:linha`, hash de commit ou link de PR.

Quando esta seção estiver vazia ao final do spec-filho, escreva:

  > Nenhum achado fora de escopo registrado nesta fase.
-->

| discoveredIn       | description                                          | proposedTarget                          | evidence                              |
|--------------------|------------------------------------------------------|-----------------------------------------|---------------------------------------|
| `<fase-N-slug>`    | `<descrição factual do achado, em pt-BR>`            | `<fase-M-slug>` ou `novo-spec-filho`    | `<src/path/arquivo.ts:linha>`         |
| `<fase-N-slug>`    | `<descrição factual do achado, em pt-BR>`            | `<fase-M-slug>` ou `novo-spec-filho`    | `<commit-hash>` ou `<link-PR>`        |

<!--
Para cada linha desta tabela, abrir em paralelo:
  - Atualização de `requirements.md` do master (campos `inputs`/`acceptance`
    da fase alvo) OU criação de novo Phase Card.
  - Referência cruzada do commit do master spec aqui mesmo, ao lado da
    linha correspondente.
-->

---

## 4. Consultas a `node_modules/next/dist/docs/` (AGENTS_Rule)

<!--
OBRIGATÓRIA quando o Phase Card desta fase no master spec tiver
`agents_rule_areas` preenchido. Hoje, isso vale para:
  - `fase-1-seguranca` (áreas: `images-config`, `headers`)
  - `fase-3-backend`   (áreas: `cache-components`, `route-segment-config`,
                                `server-actions`)
  - `fase-5-ux`        (área:  `view-transitions`)

Para fases sem `agents_rule_areas` (`fase-2-testes`, `fase-4-design-system`,
`fase-6-mobile-cross-browser`, `fase-7-dx-infra` no estado atual), registre
exatamente esta linha no lugar da tabela:

  > n/a — fase não toca APIs do Next.js.

Regra dura (cf. `design.md > Error Handling > E5` e `AGENTS.md`):
  Esta versão do Next.js (16.x) tem breaking changes em relação a
  conhecimento prévio. Toda decisão sobre uma `NextApiArea` exige consulta
  registrada a `node_modules/next/dist/docs/` ANTES da prototipação.
  Spec-filhos sem essa evidência são bloqueados pelo revisor — é a única
  regra do master spec aplicada como bloqueio duro.

Tokens válidos para a coluna `area` (ver `design.md > Data Models >
NextApiArea`):
  cache-components | view-transitions | route-segment-config |
  server-actions   | middleware-proxy | images-config        |
  headers          | metadata
-->

| area                       | path_consultado                                                                                  | trecho_relevante                                                | decisao                                              |
|----------------------------|--------------------------------------------------------------------------------------------------|-----------------------------------------------------------------|------------------------------------------------------|
| `<NextApiArea>`            | `node_modules/next/dist/docs/<caminho>/<arquivo>.md`                                             | `<1-2 linhas que justificam a decisão>`                         | `<Adotar | Não adotar | Avaliar em outro momento>`   |
| `<NextApiArea>`            | `node_modules/next/dist/docs/<caminho>/<arquivo>.md`                                             | `<1-2 linhas que justificam a decisão>`                         | `<Adotar | Não adotar | Avaliar em outro momento>`   |

<!--
Cada linha deve ser preenchida ANTES da primeira tarefa do spec-filho que
toque a `NextApiArea` correspondente. Atualizações posteriores (mudança de
versão, contradição encontrada na prática) são registradas como linhas
adicionais — NÃO se sobrescreve linha existente.
-->

---

<!--
Espaço para as demais seções específicas da fase (User Story, Glossary,
Non-Goals, Requirements em EARS por feature, etc.). Tudo o que vier daqui
para baixo segue o padrão usual de um `requirements.md` do Privello e NÃO
é regulado por este template.
-->
