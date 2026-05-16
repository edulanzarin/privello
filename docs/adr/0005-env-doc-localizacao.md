# ADR 0005 — Localização de `docs/env.md` e `docs/docker.md` separada do README

- **Status**: Aceito
- **Data**: 2026-05-16

## Contexto

A fase-7-dx-infra entrega dois documentos operacionais novos:

- `docs/env.md` — tabela canônica das variáveis de ambiente (≥ 21 entradas).
- `docs/docker.md` — instruções de uso do `docker-compose.yml` (Postgres de dev).

O `README.md` atual é compacto (~15 linhas), focado em descrição alta da stack e em
informar que o repositório é privado. Inflar o README com tabelas extensas de env
(21 linhas só na tabela) e seções de Docker (porta, volumes, comandos, notas) iria
contra esse propósito.

Alternativas consideradas:

- **Documentação dentro do README**: seções `## Variáveis de ambiente` e `## Docker`
  no `README.md`. Reduz saltos para o dev novo (1 arquivo em vez de 3) mas triplica
  o tamanho do README.
- **Documentação em `docs/`**: arquivos separados, README ganha apenas links curtos.
  Mantém o README enxuto; força 1 saltinho extra para o dev.

## Decisão

Criamos `docs/env.md` e `docs/docker.md` como arquivos separados; o `README.md` ganha
apenas dois links curtos (uma linha cada) apontando para esses arquivos. Idioma pt-BR
em ambos. Convenção consistente com `docs/adr/` (também subdiretório).

## Consequências

### Positivas

- README continua enxuto e legível em uma tela.
- Cada documento tem escopo claro e pode evoluir independentemente.
- Consistente com convenção de outros projetos Next/TS (`docs/` como diretório padrão
  de documentação operacional).
- Cross-references entre `docs/env.md` ↔ `docs/docker.md` ↔ `.env.example` ficam
  organizadas (cada arquivo tem sua seção `Cross-references` no fim).

### Negativas

- Dev novo precisa de 1 saltinho extra (README → `docs/env.md`). Mitigado pelos
  links explícitos no README.

### Neutras

- A localização escolhida (raiz/`docs/`) é compatível com geradores de documentação
  estática (ex.: Docusaurus, MkDocs) caso uma fase futura queira gerar um site de docs.
- Os ADRs (esta convenção, em `docs/adr/`) seguem o mesmo padrão de subdiretório.

## Referências

- `c:/Users/edulanzarin/Documents/Dev/privello/.kiro/specs/fase-7-dx-infra/requirements.md > Requirement 2.3`
- `c:/Users/edulanzarin/Documents/Dev/privello/.kiro/specs/fase-7-dx-infra/requirements.md > Requirement 3.6`
- `c:/Users/edulanzarin/Documents/Dev/privello/docs/env.md`
- `c:/Users/edulanzarin/Documents/Dev/privello/docs/docker.md`
- `c:/Users/edulanzarin/Documents/Dev/privello/README.md`
