# NextAuth — Configuração de Produção

> Documento canônico produzido pelas tarefas **6.3** e **7.5** do spec `fase-1-seguranca`.
> Spec-pai: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-1-seguranca\`.
> Audiência: quem faz deploy do app em Vercel ou Docker (single-instance) e quem revisa a janela de transição da CSP.

---

## 1. Por que esta configuração existe

`src/lib/auth.ts` foi reescrito na tarefa 6.1 desta fase para fechar duas frentes:

1. **Falha no boot quando `AUTH_URL` não está definido em produção.** O guard roda em tempo de carregamento de módulo — não em request — então um build/start mal configurado **se recusa a subir**, ao invés de aceitar requests com `Host` arbitrário vindo do proxy. Linhas relevantes em `src/lib/auth.ts`:

   - `src/lib/auth.ts:9-16` — bloco de guarda `if (isProd && !process.env.AUTH_URL) throw …` com o comentário que explica por que NextAuth v5 cai no `Host` se `AUTH_URL` não estiver presente.

2. **`trustHost` deixou de ser `true` aberto sem âncora.** Em produção, o `trustHost: true` continua sendo passado para o NextAuth, mas a validação real de origem fica delegada ao próprio NextAuth via `AUTH_URL` — o guard de cima garante que `AUTH_URL` está sempre presente antes do construtor do NextAuth ser chamado. Em desenvolvimento, `trustHost: true` permanece sem âncora (intencional, para acomodar `localhost`, `127.0.0.1`, túneis de teste). Documentação inline:

   - `src/lib/auth.ts:18-32` — JSDoc do bloco `export const { handlers, signIn, signOut, auth } = NextAuth({ ... })` descrevendo o posture condicional.

> Não modifique `auth.ts` para "endurecer mais" sem atualizar este documento e o `requirements.md > Requirement 6` da fase. A regra dura E4 do master (`auditoria-geral`) exige que mudanças em superfícies já fechadas voltem ao master spec via `OutOfScopeFinding`.

---

## 2. Variáveis obrigatórias em produção

Todas as três precisam estar definidas **antes** do primeiro `next start` / `node server.js` em produção. Faltar qualquer uma é falha de boot — `AUTH_URL` quebra direto pelo guard, `AUTH_SECRET` e `DATABASE_URL` quebram no primeiro request real (NextAuth e Prisma respectivamente).

| Variável | Como gerar/descobrir | Onde definir | Valor de exemplo |
|---|---|---|---|
| `AUTH_SECRET` | `openssl rand -base64 32` (ver §3) | **Vercel:** Project Settings → Environment Variables → Add (escopo `Production` + `Preview`). **Docker:** `docker-compose.yml` no bloco `services.<app>.environment`, ou `.env` lido pelo compose via `env_file`. | `K7QkXyAo+1F2pJ6wQGZxRZ3tD8mNcVbHsLxF9eTpKuM=` (placeholder, regenerar para cada ambiente) |
| `AUTH_URL` | URL pública do app, com `https://`, **sem barra final**. Em Vercel é o domínio confirmado em "Domains"; em Docker é o domínio público apontado para o reverse proxy. | **Vercel:** mesmo painel do `AUTH_SECRET`, escopo `Production` (e `Preview` se houver auth em preview deploys com domínio dedicado). **Docker:** mesmo bloco do `AUTH_SECRET`. | `https://privello.com.br` *(placeholder até o domínio real ser registrado/confirmado; substituir pelo hostname efetivo no DNS)* |
| `DATABASE_URL` | Connection string do banco em produção (Postgres). Vem do provedor (Neon, Supabase, RDS, instância própria do compose). Inclui `?schema=public&pgbouncer=true` se houver pooler. | **Vercel:** mesmo painel, escopo `Production`. **Docker:** `docker-compose.yml > services.<app>.environment` ou `.env` lido pelo compose; **não** colocar em arquivo versionado. | `postgresql://privello_app:<senha>@db.privello.internal:5432/privello?schema=public` |

Notas operacionais:

- O `.env.example` versionado tem **apenas chaves**, nunca valores reais — a tarefa 6.2 desta fase cuida da entrada `AUTH_URL`. Não copie segredo real para `.env.example`.
- Em **Docker compose com `env_file`**, o arquivo apontado precisa estar listado em `.gitignore`. Se o compose usa `environment:` inline, o segredo não pode entrar no arquivo versionado — use `${VAR}` interpolado a partir do `.env` local do host.
- Em **Vercel**, marque cada variável como "Sensitive" para que o valor não fique visível na UI após salvar.

---

## 3. Geração de `AUTH_SECRET`

Comando canônico:

```bash
openssl rand -base64 32
```

Saída: 44 caracteres em base64 (32 bytes de entropia). É o formato esperado pelo NextAuth v5 — qualquer string longa funciona, mas a documentação oficial aponta `openssl rand -base64 32` como referência. Se `openssl` não estiver disponível no host:

```bash
# alternativa Node — mesmo nível de entropia
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Regras de armazenamento (não negociáveis):

- **Nunca commitar.** O `.env.example` versionado lista a chave sem valor; o `.env` real fica no `.gitignore`.
- **Nunca ecoar em log de CI.** Em GitHub Actions / Vercel CI, sempre usar o mecanismo de secrets do provedor; nunca `echo $AUTH_SECRET` em step. Se um log capturou o segredo por descuido, considere o segredo vazado e gere um novo (próximo bullet).
- **Rotacionar após suspeita de vazamento.** Gere com o mesmo comando, atualize na Vercel/compose e faça redeploy. Sessões existentes serão invalidadas (JWTs assinados com o segredo antigo deixam de validar) — isso é parte do contrato de rotação, não defeito.
- **Ambientes separados.** Production, Preview e Development usam segredos diferentes. Reaproveitar segredo de dev em prod é tratado como vazamento.

---

## 4. Validação pós-deploy

Depois de fazer o deploy com as três variáveis configuradas, valide do lado de fora antes de declarar o deploy "ok":

```bash
# 1. GET sem cookie — endpoint deve responder 200 com body JSON vazio (ou {})
curl -i "https://privello.com.br/api/auth/session"

# 2. GET com cookie de sessão real (capturar do browser logado)
curl -i \
  -H 'Cookie: authjs.session-token=<copiar do navegador>' \
  "https://privello.com.br/api/auth/session"

# 3. POST sem cookie — esperado 405 Method Not Allowed
curl -i -X POST "https://privello.com.br/api/auth/session"
```

Resposta esperada (caminho 1, sem sessão):

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{}
```

Resposta esperada (caminho 2, com cookie válido):

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "user": { "id": "...", "email": "...", "name": "...", "role": "..." },
  "expires": "2026-..."
}
```

Resposta esperada (caminho 3, POST):

```http
HTTP/1.1 405 Method Not Allowed
```

Comportamento normal a registrar (não é bug):

- **`405` em `POST /api/auth/session`** — `session` é um endpoint de leitura no NextAuth v5; só `GET` é roteado. POST é o resultado correto a esperar.
- **`200` em `GET /api/auth/session` sem cookie com body `{}`** — significa "sem sessão ativa"; **não** é 401. NextAuth nunca devolve 401 nesse endpoint, esse é o contrato.
- **`200` com user populado em `GET` com cookie válido** — confirma que `AUTH_SECRET` no servidor consegue validar o JWT presente no cookie. Se vier `{}` mesmo com cookie válido, o `AUTH_SECRET` mudou entre o último login e o deploy atual; isso é o sintoma esperado da rotação.

Se os três caminhos baterem com o esperado, o NextAuth está saudável em produção. Se `GET` sem cookie devolver 500 ou conexão recusada, **provavelmente** `AUTH_URL` está apontando para um host que não atinge o servidor — confira DNS, CDN e o valor literal da variável.

---

## 5. Janela de validação CSP (também atende a tarefa 7.5)

> **Esta seção é o documento canônico para a transição CSP `Report-Only` → enforcement.** A tarefa 7.5 foi explicitamente declarada satisfeita aqui em vez de criar um `csp-rollout.md` separado, dado o tamanho do tópico.

### 5.1 O que está em produção hoje (saída desta fase)

Após a tarefa 7.2 desta fase, `next.config.ts` envia `Content-Security-Policy-Report-Only` em todas as rotas. **Report-Only não bloqueia nada** — o browser apenas **reporta** violações para o `report-uri` configurado (ou para o console DevTools quando não há endpoint). O usuário final não percebe nada; o app funciona normalmente.

A política em si vive em `next.config.ts > async headers()`, gerada a partir do inventário em `csp-origins.md` (tarefa 7.1).

### 5.2 Janela mínima

**A política `Content-Security-Policy-Report-Only` precisa ficar ativa em produção por no mínimo 7 dias antes de qualquer transição para `Content-Security-Policy` enforcement.**

Razões:

- 7 dias cobrem o ciclo completo de uso do app, incluindo segunda-feira de manhã (pico de usuários voltando) e fim de semana (perfil de uso diferente).
- Cobre browsers atrasados em atualização (usuário com aba aberta há vários dias) e re-engajamento de usuários esporádicos.
- Dá tempo de relatos chegarem por canais não-automatizados (Suporte/SAC) caso algum recurso visualmente quebre.

A janela conta a partir do **primeiro request servido pela versão de produção que carrega o header**, não do merge do PR. Anote a data/hora do primeiro request com o header novo (Vercel: aba "Deployments" → timestamp do deploy ativo; Docker: timestamp do `docker compose up -d` que carregou a config).

### 5.3 Critério de transição

A transição de `Content-Security-Policy-Report-Only` para `Content-Security-Policy` (enforcement) só é autorizada quando **as três condições abaixo são todas verdadeiras**:

1. **Janela mínima cumprida.** ≥ 7 dias corridos com o header em produção.
2. **Zero violações reportadas no período.** Se há `report-uri`/`report-to` configurado, o endpoint não recebeu nenhum `csp-report` durante a janela. Se o relatório vai só para console DevTools de desenvolvedores, é necessário dump manual em sessão de QA cobrindo as rotas críticas (login, cadastro, painel, perfil público, upload, MercadoPago checkout) com zero entradas de tipo `Content Security Policy` no console.
3. **Inventário de origens em `csp-origins.md` foi revisado** no fim da janela e bate com o que efetivamente saiu na rede (cross-check via DevTools → Network → coluna `Initiator/Origin`).

Se qualquer uma das três falhar, **não transitar**. Em particular, "violação isolada que parece bug do browser" não é descartável sem investigação — a regra é literal.

### 5.4 Procedimento de reversão

A transição em si é declarada **fora de escopo da fase-1-seguranca** (a fase 1 entrega só o header em modo `Report-Only`). Entretanto, quando uma fase futura for executar a transição, o caminho de reversão precisa estar pronto antes do commit que faz a transição:

1. **Antes da transição**, registrar em `csp-origins.md` a string CSP exata que está em produção em `Report-Only`. É essa string que a transição vai promover; é também essa string que volta no caso de reversão.
2. **A transição** consiste em editar `next.config.ts > async headers()` mudando a chave do header de `"Content-Security-Policy-Report-Only"` para `"Content-Security-Policy"`. **Nada mais muda** — mesma string de valor, mesma rota, mesmo `source: "/(.*)"`.
3. **Reversão**, se o site quebrar para usuários reais após a transição:

   - Editar `next.config.ts` re-adicionando o sufixo `-Report-Only` na chave do header.
   - `git commit` com mensagem `revert(csp): voltar para Report-Only` e fazer **redeploy imediato** (Vercel: `git push` da branch principal; Docker: `docker compose up -d --build` no host).
   - Anotar no `csp-origins.md` qual diretiva quebrou e adicionar a origem faltante; reabrir nova janela de 7 dias do zero.
4. **Não tentar mitigar com `'unsafe-inline'` ou `'unsafe-eval'` adicionados em emergência** — se a CSP que era válida em `Report-Only` quebra ao virar enforcement, a causa real é divergência entre o que o browser reportou e o que ele bloqueia. Reverter primeiro, investigar depois.

### 5.5 Nota explícita de escopo

**A transição CSP `Report-Only` → enforcement está fora do escopo da fase-1-seguranca.** Esta fase entrega:

- Header `Content-Security-Policy-Report-Only` ativo em produção (tarefa 7.2).
- Janela de validação documentada (esta seção, tarefa 7.5).
- Procedimento de reversão documentado (esta seção, tarefa 7.5).

Esta fase **não** entrega:

- O commit que troca `-Report-Only` pelo header de enforcement.
- O monitoramento/coleta dos `csp-report` (depende de endpoint de relatório, que é trabalho separado).
- A revisão de janela ao fim dos 7 dias.

Esses três itens viram tarefa em fase posterior (candidata: `fase-7-dx-infra`, junto com store compartilhado de rate limit e rotação de chaves).

---

## 6. Cross-references

- **`requirements.md > §4`** desta fase: linhas de AGENTS_Rule registradas para as áreas `images-config` e `headers`. A linha de `headers` justifica a escolha de **CSP estático em `Report-Only`** (sem nonce, sem `proxy.ts`) para preservar static rendering planejado pela `fase-3-backend`. A linha de `images-config` é citada aqui apenas para fechar o cross-link — a whitelist em si vive em `next.config.ts > images.remotePatterns` (tarefa 3.2).
  - Caminho: `c:\Users\edulanzarin\Documents\Dev\privello\.kiro\specs\fase-1-seguranca\requirements.md`, seção "4. Consultas a `node_modules/next/dist/docs/` (AGENTS_Rule)".
- **`fase-7-dx-infra`** (futura): o README operacional consolidado dessa fase deve apontar para este documento como a fonte de verdade da configuração de produção do NextAuth e do rollout da CSP. Quando `fase-7-dx-infra` virar `Done`, atualizar este documento com o link recíproco para o README dela.
- **`csp-origins.md`** (mesma pasta): inventário de origens reais por diretiva CSP, produzido pela tarefa 7.1. É a entrada que alimenta a string final do header em `next.config.ts`.
- **`src/lib/auth.ts`** (não modificar a partir deste documento): código fonte do guard e do construtor do NextAuth. Mudanças nele exigem nova entrada no `requirements.md` da fase ou `OutOfScopeFinding` no master.
