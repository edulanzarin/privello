# Rate limits — `fase-1-seguranca`

> **Fonte da verdade:** [`src/lib/rate-limit-config.ts`](../../../src/lib/rate-limit-config.ts) (`RATE_LIMIT_TABLE`).
>
> Este documento espelha em prosa a tabela canônica para revisão humana. Qualquer alteração de valor (escopo, janela, limite ou resposta) **DEVE** ser aplicada simultaneamente em `src/lib/rate-limit-config.ts` e neste arquivo no **mesmo commit**. Divergência entre os dois é bug e bloqueia a saída da fase (`tasks.md > 8.1`).
>
> Referências cruzadas:
>
> - `requirements.md > Requirement 5` (acceptance criteria 5.1, 5.2, 5.4)
> - `design.md > Data Models > RateLimitTable`
> - `design.md > Correctness Properties` (Properties 1, 2, 3)

## Tabela canônica

| Endpoint | Chave (key shape) | Janela | Limite | Resposta ao exceder | Log de auditoria |
|---|---|---|---|---|---|
| `login` (NextAuth) | `ip` | 15 min | 5 tentativas | HTTP 429 com header `Retry-After` | yes |
| `/api/upload` | `userId` (sessão autenticada) | 1 h | 20 uploads | HTTP 429 com mensagem | yes |
| `/api/wa-click` | `${profileId}:${ip}` | 1 h | 10 cliques | HTTP 200 silencioso — não revela limite, não registra o clique | no |
| comentários (mídia + stories) | `userId` | 1 min | 5 comentários | HTTP 429 com mensagem | yes |
| visualização de stories (`view`) | `${userId}:${storyId}` | 1 h | 1 visualização | HTTP 200 silencioso — comportamento idempotente, não conta novamente na mesma janela | no |

**Observações por endpoint:**

- `login`: a chave é o IP do cliente (não há sessão antes do login). O log de auditoria registra `{ ts, ip, attempt }` conforme `tasks.md > 5.4`. O `Retry-After` é calculado a partir de `windowSec` restante.
- `upload`: a chave é o `userId` da sessão NextAuth. Validação atual de `Content-Length`/MIME/tamanho permanece intacta — rate limit é uma camada adicional, não substitui (`tasks.md > 5.5`).
- `waClick`: silêncio é deliberado. Revelar o limite ou retornar 429 daria ao atacante sinal para mapear o limite, e contar o clique excedente envenenaria a métrica de conversão. O endpoint responde 200 sem registrar o clique no banco.
- `comment`: aplica-se tanto aos comentários de mídia quanto aos comentários de story (mesmo budget compartilhado por usuário).
- `storyView`: o limite de 1 por hora por par `(userId, storyId)` materializa idempotência da contagem de view — visualizações repetidas na mesma janela retornam 200 sem incrementar o contador da story.

## Restrição de instância única

O store default de `rateLimit` é um `Map` em memória do processo Node (ver `src/lib/rate-limit.ts`). Isso significa que **os contadores são por processo**: em um deployment com múltiplas instâncias (réplicas atrás de um load balancer, workers serverless concorrentes, etc.), cada instância mantém o próprio contador e o limite efetivo passa a ser `N × limit`, onde `N` é o número de instâncias.

Para o estado conhecido do Privello (single-instance), o comportamento é correto. A migração para um store compartilhado (Redis/Upstash, ou equivalente) está declarada como `OutOfScopeFinding` da `fase-1-seguranca` para a `fase-7-dx-infra` — ver `design.md > Error Handling` ("Rate limit em multi-instance"). Nenhuma decisão sobre store compartilhado é tomada nesta fase.

## Escopo desta task (5.3) e wiring posterior

Esta task entrega **apenas** o documento. Nenhum código de rate limit é introduzido aqui.

A aplicação efetiva dos limites em endpoints é coberta pelas tasks subsequentes:

- `5.4` — login (NextAuth)
- `5.5` — `/api/upload`
- `5.6` — `/api/wa-click`
- `5.7` — endpoints de comentários
- `5.8` — endpoints de visualização de stories

A regra dura é: ao tocar qualquer um desses endpoints em 5.4–5.8, o autor da mudança consulta esta tabela (e `RATE_LIMIT_TABLE`) e usa `rateLimitConfigFor(endpoint, key)` — não reimplementa valores inline. Divergência entre o código aplicado e este documento é bug.
