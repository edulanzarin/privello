# ADR NNNN — \<título curto em pt-BR\>

- **Status**: Proposto | Aceito | Substituído por NNNN | Rejeitado
- **Data**: YYYY-MM-DD

## Contexto

\<1–3 parágrafos descrevendo o problema e os fatores em jogo. Inclua:

- O que motivou a decisão (qual gap, qual dor).
- Quais alternativas foram consideradas (sem aprofundar — só listar).
- Restrições não-negociáveis (segurança, AGENTS_Rule, escopo de fase).\>

## Decisão

\<1 parágrafo declarativo da decisão tomada. Use voz ativa: "Adotamos X em vez de Y porque Z."\>

## Consequências

### Positivas

- Item 1
- Item 2

### Negativas

- Item 1 (e como mitigar)
- Item 2

### Neutras

- Item 1 (esperado mas vale registrar)

## Referências

- `c:/.../path/para/spec/.md > §X` — relevância.
- `node_modules/next/dist/docs/<area>.md` — quando aplicável (AGENTS_Rule).
- ADRs anteriores que esta substitui ou complementa.

---

## Notas para uso

Convenções de uso deste modelo de ADR (cf. `dx-conventions.md > §5 ADRs`):

- **Localização**: `docs/adr/`. Nenhum outro caminho aceito.
- **Numeração**: sequencial, **sem reuso**, 4 dígitos (`0001-`, `0002-`, ..., `9999-`).
  Mesmo se um ADR for marcado como `Rejeitado` ou `Substituído por NNNN`, o número
  permanece reservado — não pode ser reaproveitado.
- **Nome do arquivo**: `NNNN-titulo-curto-em-kebab-case.md`. Sem acentos, sem espaços.
- **Idioma**: pt-BR (corpo, status, datas em ISO-8601).
- **Status**:
  - `Proposto` — ainda em discussão; pode ser editado livremente.
  - `Aceito` — decisão tomada e em vigor; edições subsequentes apenas em
    "Consequências > Neutras" (registrar fatos novos sem mudar a decisão).
  - `Substituído por NNNN` — decisão revogada por outro ADR. NÃO deletar o ADR antigo;
    mudar o status e adicionar o link no campo "Referências" do ADR novo.
  - `Rejeitado` — proposta rejeitada após discussão; manter como histórico.
- **Templating**: este arquivo (`0001-template.md`) é o template canônico. ADRs novos
  copiam este conteúdo e preenchem.
- **Substituição vs prosa em design.md**: a partir desta fase, decisões arquiteturais
  relevantes vão para ADR. `design.md` futuros referenciam o ADR (`ver ADR NNNN`)
  em vez de duplicar a justificativa.
