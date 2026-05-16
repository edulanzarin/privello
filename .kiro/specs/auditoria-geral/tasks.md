# Implementation Plan: Auditoria Geral

## Overview

Este spec é um **documento de governança**, não software executável. O `requirements.md` e o `design.md` já existem e definem 7 fases promovíveis a specs-filhos. As tarefas abaixo focam apenas no que falta para o master spec atingir o estado de saída descrito em `design.md > Saída deste spec`:

1. Sanear o `requirements.md` contra a rubrica dos 7 checks de validação do `design.md`.
2. Produzir o scaffold textual mínimo para que cada fase possa ser promovida a spec-filho sem nova rodada de descoberta.

Restrições importantes refletidas neste plano:

- **Sem property tests, sem unit tests, sem integration tests.** O design não declara propriedades de correção (justificativa em `design.md > Testing Strategy`) e o sistema sob design não tem código executável próprio. Testes pertencem aos specs-filhos (Fase 2 instala Vitest + fast-check; demais fases consomem).
- **Sem lint script do roadmap aqui.** O `design.md` deixa essa tarefa explicitamente para o spec-filho da Fase 7.
- **Sem implementação das fases.** O master spec entrega plano e critérios; execução roda nos specs-filhos.
- Todos os artefatos são markdown em `.kiro/specs/auditoria-geral/`. Nenhuma alteração em código de aplicação.

## Tasks

- [x] 1. Sanear o `requirements.md` contra a rubrica de spawn-readiness
  - [x] 1.1 Auditar IDs estáveis e schema de Phase Card no `requirements.md`
    - Confirmar que existem exatamente 7 fases com IDs `fase-1-seguranca`, `fase-2-testes`, `fase-3-backend`, `fase-4-design-system`, `fase-5-ux`, `fase-6-mobile-cross-browser`, `fase-7-dx-infra`
    - Para cada fase, verificar presença não-ambígua de objetivo, entradas, saídas, critérios de aceite (EARS) e fora de escopo, conforme `design.md > Components and Interfaces > Phase Card`
    - Corrigir inline lacunas ou redações vagas em `requirements.md`; rebaixar fase para "Drafted" via comentário se algum campo permanecer vago
    - _Requirements: 1.1, 1.2, 1.6, 9.1_

  - [x] 1.2 Auditar cobertura da AGENTS_Rule em fases que tocam Next 16
    - Verificar que Requirements 2 (segurança / `images.remotePatterns`, headers), 4 (Cache Components, Service layer com route segment config) e 6 (View Transitions) referenciam explicitamente o dever de consulta a `node_modules/next/dist/docs/`
    - Adicionar a referência inline onde estiver ausente, citando a área (`cache-components`, `view-transitions`, `images-config`, `headers`, etc.) conforme tipo `NextApiArea` em `design.md > Data Models`
    - _Requirements: 1.5, 4.3, 6.3_

  - [x] 1.3 Confrontar `requirements.md` com a lista de itens já resolvidos do `design.md`
    - Cruzar cada item ✅ de `design.md > Estado de partida` (HMAC do webhook MP, headers básicos, validação de upload, índices Prisma já adicionados, services iniciais) contra os critérios de aceite das fases
    - Reescrever ou remover qualquer critério que ainda exija trabalho já concluído, mantendo o EARS apenas como referência histórica quando útil
    - Garantir que o protocolo de "Revalidação" (Confirmado/Resolvido/Reescopado) descrito em `design.md > Components and Interfaces > Child Spec Bridge` esteja referenciado em Requirement 1.4
    - _Requirements: 1.3, 1.4, 9.3_

  - [x] 1.4 Validar mapeamento dos 5 specs arquivados às fases
    - Confirmar que cada diretório em `.kiro/specs/_archive/` (`backend-performance-phase5`, `design-system`, `final-polish-phase`, `ux-premium-phase4`, `ux-premium-polish`) aparece como `historicalRefs` de pelo menos uma fase, conforme tabela em `design.md > Data Models > ArchivedSpecRef`
    - Adicionar referências faltantes em `requirements.md` (seção introdutória ou subseção da fase correspondente) usando caminhos absolutos
    - _Requirements: 1.3_

- [x] 2. Checkpoint — saneamento do master concluído
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Produzir scaffold de promoção para specs-filhos
  - [x] 3.1 Criar template de spec-filho em `.kiro/specs/auditoria-geral/_template-spec-filho.md`
    - Cabeçalho de proveniência: caminho absoluto deste master spec, `phase.id`, lista de critérios herdados
    - Seção "Revalidação" com placeholders para cada item arquivado classificado como `Confirmado` / `Resolvido` / `Reescopado`
    - Seção "Achados fora de escopo" com schema de `OutOfScopeFinding` (`discoveredIn`, `description`, `proposedTarget`, `evidence`)
    - Seção "Consultas a `node_modules/next/dist/docs/`" para registrar evidência da AGENTS_Rule por área `NextApiArea`
    - Comentários no template indicando quais blocos são obrigatórios para fases com `agentsRuleAreas` preenchido
    - _Requirements: 1.4, 9.2, 9.3_

  - [x] 3.2 Criar guia de promoção de fase em `.kiro/specs/auditoria-geral/PROMOCAO.md`
    - Procedimento textual da transição `SpawnReady → InProgress`: criar `.kiro/specs/{phase-id}/`, copiar `_template-spec-filho.md` como `requirements.md` do filho, preencher proveniência, atualizar `state` e `childSpecPath` desta fase no master
    - Diagrama ou enumeração das transições de `PhaseState` espelhando `design.md > Architecture` (Drafted, SpawnReady, InProgress, Blocked, Done)
    - Regras de retorno ao master quando ocorrer `OutOfScopeFinding` ou regressão entre fases (E4 e E6 de `design.md > Error Handling`)
    - Indicação explícita do grafo de dependências entre fases (F1/F2 → F3; F2/F4 → F5; F4/F5 → F6; F1/F2/F3 → F7) como pré-condição para promoção
    - _Requirements: 1.6, 9.1, 9.2, 9.4_

- [x] 4. Checkpoint final — master spec pronto para promover fases
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Não há sub-tarefas marcadas com `*`. O design não define propriedades de correção e o sistema sob design não tem código executável próprio, portanto a regra "incluir property tests apenas quando o design tem Correctness Properties" remove qualquer sub-tarefa de teste deste plano.
- Cada tarefa modifica ou cria exatamente um arquivo em `.kiro/specs/auditoria-geral/`. Tarefas que tocam o mesmo arquivo (1.1, 1.2, 1.3, 1.4 → todas em `requirements.md`) estão em ondas distintas no grafo de dependências.
- Toda decisão que envolva APIs do Next 16 dentro dos specs-filhos derivados deve respeitar a regra de `AGENTS.md` e registrar a consulta a `node_modules/next/dist/docs/` no template criado em 3.1.
- A execução real das 7 fases ocorre em specs-filhos separados, não neste plano. Após a tarefa 4, o master spec está apto a ser usado como fonte de promoção, mas nenhuma fase é implementada aqui.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3"] },
    { "id": 3, "tasks": ["1.4"] },
    { "id": 4, "tasks": ["3.1", "3.2"] }
  ]
}
```
