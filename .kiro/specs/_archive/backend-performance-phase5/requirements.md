# Requirements Document

## Introduction

Este documento define os requisitos para a Fase 5 do plano de melhorias da plataforma Privello. O foco é otimizar performance do backend e frontend, eliminar gargalos, reduzir código redundante, melhorar segurança, validações e tipagem, e garantir sustentabilidade técnica a longo prazo. A plataforma é construída com Next.js 16, Prisma 5, TypeScript e Tailwind CSS.

## Glossary

- **Sistema**: A aplicação Privello como um todo (frontend + backend + banco de dados)
- **API_Router**: As rotas de API REST em `src/app/api/`
- **Server_Actions**: As Server Actions em `src/app/_actions/` e `src/app/painel/_actions/`
- **Query_Layer**: A camada de consultas ao banco em `src/lib/queries.ts` e `src/lib/services/`
- **Prisma_Client**: O cliente Prisma singleton em `src/lib/prisma.ts`
- **Cache_Layer**: A camada de cache (revalidação, memoização, headers de cache)
- **Bundle**: O pacote JavaScript enviado ao navegador
- **Core_Web_Vitals**: Métricas LCP, FID/INP e CLS definidas pelo Google
- **Force_Dynamic**: Diretiva `export const dynamic = "force-dynamic"` que desabilita cache de página
- **Validator**: Módulo de validação de entrada (Zod schemas)
- **Rate_Limiter**: Módulo de limitação de requisições por IP/usuário

## Requirements

### Requisito 1: Otimização de Queries do Banco de Dados

**User Story:** Como desenvolvedor, quero que as consultas ao banco sejam eficientes e sem redundâncias, para que o tempo de resposta das páginas diminua e o banco não seja sobrecarregado.

#### Critérios de Aceitação

1. WHEN a função `getProfileBySlug` é chamada, THE Query_Layer SHALL retornar no máximo 12 itens de mídia pública ordenados por `sortOrder` ascendente, e SHALL aceitar um parâmetro `mediaOffset` (padrão 0) para retornar os próximos 12 itens sob demanda via paginação offset-based
2. WHEN a função `listProfilesForCity` é chamada, THE Query_Layer SHALL executar a ordenação diretamente no SQL via Prisma `orderBy` com a sequência: `featuredUntil` descendente (nulls last), `planTier` por peso (PREMIUM > DESTAQUE > ESSENCIAL), e `ratingAvg` descendente, sem utilizar ordenação em memória JavaScript
3. WHEN a função `getSectionProfiles` é chamada com tipo "boosted", THE Query_Layer SHALL utilizar `orderBy` com os campos `planTier` (PREMIUM primeiro, DESTAQUE segundo, ESSENCIAL terceiro) e `viewsCurrentPeriod` descendente diretamente no Prisma, sem ordenar arrays em memória e sem buscar registros além do `offset + limit + 1` necessários para determinar paginação
4. WHEN a função `listStoriesForCity` é chamada, THE Query_Layer SHALL utilizar `distinct` por `profileId` no Prisma para obter a lista de perfis com stories ativas, em vez de buscar todas as stories e agrupar manualmente com `Map` em JavaScript
5. THE Query_Layer SHALL incluir índices compostos no schema Prisma para as seguintes combinações de filtro: `[cityId, servesMen, isSuspended]`, `[cityId, servesWomen, isSuspended]`, `[cityId, servesCouples, isSuspended]`, e `[featuredUntil, isSuspended, planTier]`
6. WHEN uma query retorna dados de relações aninhadas (city, district, media, user), THE Query_Layer SHALL utilizar `select` explícito limitando os campos retornados àqueles referenciados no código consumidor, não retornando mais de 10 campos por relação incluída
7. IF o parâmetro `mediaOffset` fornecido a `getProfileBySlug` for menor que 0, THEN THE Query_Layer SHALL tratar o valor como 0 e retornar a primeira página de mídia

### Requisito 2: Estratégia de Cache e Revalidação

**User Story:** Como desenvolvedor, quero implementar uma estratégia de cache consistente, para que páginas públicas sejam servidas rapidamente sem dados desatualizados.

#### Critérios de Aceitação

1. WHEN a página inicial (`/`) é renderizada, THE Sistema SHALL utilizar `revalidate = 60` em vez de `force-dynamic`
2. WHEN a página de descobrir (`/descobrir/[citySlug]`) é renderizada, THE Sistema SHALL utilizar `revalidate = 300` em vez de `force-dynamic`
3. WHEN um perfil é atualizado via Server Actions que alteram dados visíveis publicamente (informações do perfil, disponibilidade, valores, mídias ou status online), THE Sistema SHALL chamar `revalidatePath` para `/p/[slug]` do perfil correspondente e para `/descobrir/[citySlug]` da cidade associada ao perfil
4. IF o visitante não está autenticado ou está autenticado mas visualiza um perfil que não é o seu, THEN THE Sistema SHALL renderizar a página de perfil público (`/p/[slug]`) com `revalidate = 120`
5. WHILE o usuário está autenticado e visualiza seu próprio perfil, THE Sistema SHALL renderizar a página `/p/[slug]` sem cache (dynamic rendering, sem revalidate)
6. THE API_Router SHALL retornar header `Cache-Control: public, max-age=60, stale-while-revalidate=120` para os endpoints de listagem pública (`/api/profiles`, `/api/discover`)
7. IF a revalidação sob demanda (via `revalidatePath`) falhar, THEN THE Sistema SHALL continuar servindo o conteúdo em cache anterior até a próxima revalidação automática por tempo (time-based revalidation)

### Requisito 3: Validação de Entrada com Schemas Tipados

**User Story:** Como desenvolvedor, quero que todas as entradas de dados sejam validadas com schemas tipados, para que dados inválidos sejam rejeitados antes de atingir o banco e a tipagem TypeScript seja consistente.

#### Critérios de Aceitação

1. THE Validator SHALL validar todos os dados de entrada em Server_Actions antes de executar operações no banco de dados, aplicando regras de tipo, formato e limites definidos no schema correspondente à operação invocada
2. WHEN dados inválidos são enviados a uma Server_Action, THE Validator SHALL retornar um objeto de erro contendo o nome do campo que falhou, a regra de validação violada e o valor limite esperado
3. THE Validator SHALL definir schemas para: criação de perfil, atualização de perfil, registro de usuário, criação de avaliação, upload de mídia e registro financeiro, incluindo para cada campo as restrições de tipo, comprimento máximo de strings (máximo 100 caracteres para nomes e labels, máximo 2000 caracteres para campos de texto livre), intervalos numéricos (idade: 18–99, preços em centavos: 1–99999900, rating: 1–5) e formatos obrigatórios (email em formato RFC 5322, telefone com código de país, slug apenas alfanumérico com hífens e máximo 60 caracteres)
4. WHEN um endpoint da API_Router recebe um body JSON, THE Validator SHALL validar o body contra o schema registrado para aquela rota antes de processar a requisição
5. THE Validator SHALL exportar tipos TypeScript inferidos dos schemas para uso em componentes e serviços, de modo que cada schema produza um tipo nomeado correspondente acessível via import
6. IF um campo obrigatório está ausente, possui tipo incorreto, excede os limites definidos no schema ou viola uma regra de formato, THEN THE Validator SHALL rejeitar a requisição com status HTTP 400 e um corpo de resposta contendo a lista de todos os erros de validação encontrados
7. IF a validação falha em uma Server_Action invocada a partir de um formulário, THEN THE Validator SHALL preservar os dados previamente preenchidos pelo usuário no estado do formulário, permitindo correção sem re-digitação
8. WHEN múltiplos campos são inválidos em uma única requisição, THE Validator SHALL retornar todos os erros de validação simultaneamente em vez de apenas o primeiro erro encontrado

### Requisito 4: Segurança e Autenticação

**User Story:** Como desenvolvedor, quero que a autenticação e autorização sejam robustas e consistentes, para que dados sensíveis estejam protegidos contra acessos não autorizados.

#### Critérios de Aceitação

1. THE Rate_Limiter SHALL limitar requisições de login a 5 tentativas por 15 minutos por endereço IP e, ao exceder o limite, SHALL rejeitar requisições subsequentes com status HTTP 429 e uma mensagem indicando o tempo restante até a liberação
2. THE Rate_Limiter SHALL limitar requisições de upload a 20 por hora por usuário autenticado e, ao exceder o limite, SHALL rejeitar requisições subsequentes com status HTTP 429 e uma mensagem indicando que o limite de uploads foi atingido
3. THE Rate_Limiter SHALL limitar requisições ao endpoint `/api/wa-click` a 10 por hora por combinação de profileId e IP e, ao exceder o limite, SHALL descartar silenciosamente a requisição retornando resposta de sucesso sem registrar o clique
4. WHEN uma Server_Action que modifica dados é chamada sem sessão autenticada válida, THE Sistema SHALL redirecionar o usuário para a página de login (`/entrar`) sem executar nenhuma operação de escrita
5. WHEN uma Server_Action do painel administrativo é chamada por um usuário que não possui role ADMIN nem MODERATOR, THE Sistema SHALL redirecionar o usuário para a página raiz (`/`) sem executar a operação
6. IF uma requisição a uma rota de API que aceita body é recebida sem header `Content-Type: application/json` ou `Content-Type: multipart/form-data`, THEN THE API_Router SHALL rejeitar a requisição com status HTTP 415 antes de processar o body
7. IF um token JWT expirou ou é inválido, THEN THE Sistema SHALL redirecionar o usuário para a página de login (`/entrar`) sem incluir detalhes técnicos do erro na URL ou na resposta visível ao usuário
8. WHEN o Rate_Limiter rejeita uma requisição de login por excesso de tentativas, THE Sistema SHALL registrar o evento com o endereço IP e timestamp para fins de auditoria, sem expor informações internas ao cliente

### Requisito 5: Separação de Responsabilidades e Camada de Serviços

**User Story:** Como desenvolvedor, quero que a lógica de negócio esteja separada das rotas e componentes, para que o código seja testável, reutilizável e fácil de manter.

#### Critérios de Aceitação

1. THE Sistema SHALL migrar todas as funções de `queries.ts` que contenham lógica além de uma única chamada Prisma (transformações de dados, ordenação, agrupamento, cálculos ou condicionais de negócio) para módulos de serviço em `src/lib/services/`, mantendo em `queries.ts` apenas re-exports temporários para compatibilidade
2. WHEN uma Server_Action precisa executar lógica de negócio (validação de regras, transformação de dados ou operações compostas envolvendo mais de uma chamada ao banco), THE Server_Actions SHALL delegar para o serviço correspondente em vez de acessar o Prisma_Client diretamente
3. THE Sistema SHALL criar serviços em `src/lib/services/` para os domínios: perfis, assinaturas, mídia, cidades, verificação, financeiro e suporte, com cada serviço contendo no mínimo as operações já existentes no domínio correspondente em `queries.ts` e nas Server_Actions atuais
4. THE Sistema SHALL definir interfaces ou tipos TypeScript para os parâmetros e retornos de cada método público exportado pelos módulos de serviço, excluindo funções auxiliares internas não exportadas
5. WHEN um serviço precisa acessar o banco de dados, THE Sistema SHALL receber o Prisma_Client como parâmetro opcional com valor padrão sendo a instância singleton de `src/lib/prisma.ts`, permitindo a injeção de um client mock em testes unitários
6. THE Sistema SHALL manter cada Server_Action com no máximo 30 linhas de código executável (excluindo linhas em branco, comentários e declarações de import), delegando lógica complexa para serviços
7. IF um método de serviço encontrar um erro de negócio (recurso não encontrado, violação de regra ou falha de validação), THEN THE Sistema SHALL retornar um objeto de resultado tipado contendo a indicação de erro em vez de lançar exceções, permitindo que a Server_Action repasse a mensagem de erro ao cliente

### Requisito 6: Tipagem TypeScript Estrita

**User Story:** Como desenvolvedor, quero que toda a base de código utilize tipagem estrita sem `any`, para que erros sejam detectados em tempo de compilação e a IDE forneça autocompletar preciso.

#### Critérios de Aceitação

1. THE Sistema SHALL configurar `strict: true` no `tsconfig.json` com `noImplicitAny` habilitado, e o build (`next build`) SHALL completar com zero erros de tipagem
2. THE Sistema SHALL eliminar todos os usos de tipo `any` explícito em arquivos dentro de `src/`, substituindo por tipos específicos ou genéricos, excluindo arquivos gerados automaticamente (Prisma Client, `.next/`)
3. WHEN um componente React recebe props, THE Sistema SHALL definir uma interface ou type alias nomeado exportado para as props de cada componente que possua 1 ou mais propriedades
4. THE Sistema SHALL definir tipos de retorno explícitos para todas as funções exportadas em arquivos dentro de `src/services/`, `src/lib/`, e `src/app/api/`
5. WHEN dados são recebidos de uma API externa (MercadoPago, NextAuth), THE Sistema SHALL definir tipos de resposta esperados e validar a estrutura em runtime antes do uso
6. IF a validação em runtime de dados de API externa falhar (estrutura não corresponde ao tipo esperado), THEN THE Sistema SHALL rejeitar o dado, não prosseguir com o processamento, e registrar o erro com indicação de qual campo divergiu do tipo esperado
7. THE Sistema SHALL utilizar o operador `satisfies` do TypeScript para validar objetos de configuração e constantes literais contra seus tipos declarados, sem perder a inferência de valores específicos

### Requisito 7: Performance do Frontend — Lazy Loading e Code Splitting

**User Story:** Como usuário, quero que as páginas carreguem rapidamente, para que eu possa navegar pela plataforma sem esperas longas.

#### Critérios de Aceitação

1. WHEN a página de perfil público é carregada, THE Sistema SHALL carregar o componente MediaGallery via `next/dynamic` com `ssr: false`, exibindo um skeleton placeholder com as dimensões aproximadas do componente final durante o carregamento
2. WHEN a página de reels é carregada, THE Sistema SHALL carregar o componente ReelsFeed via `next/dynamic` com `ssr: false`, exibindo um skeleton placeholder durante o carregamento
3. WHEN a página de descobrir é carregada e há stories disponíveis, THE Sistema SHALL carregar o componente StoryBar via `next/dynamic` com `ssr: false`, exibindo um skeleton placeholder durante o carregamento
4. THE Bundle SHALL ter tamanho inicial (First Load JS) inferior a 150KB para todas as rotas que não exigem autenticação (landing page, perfil público, página de descobrir)
5. THE Sistema SHALL utilizar `next/dynamic` com `loading` prop para exibir skeletons em todo componente cujo módulo individual exceda 50KB de tamanho comprimido (gzip)
6. WHEN um componente utiliza recharts ou lucide-react, THE Sistema SHALL importar apenas os módulos específicos utilizados (named imports individuais) em vez do pacote completo, resultando em nenhum módulo não-utilizado presente no bundle da rota
7. IF um componente carregado via `next/dynamic` falhar ao carregar em até 10 segundos ou retornar erro de rede, THEN THE Sistema SHALL exibir uma mensagem de erro com opção de tentar novamente, sem bloquear a renderização do restante da página

### Requisito 8: Performance do Frontend — Memoização e Re-renders

**User Story:** Como usuário, quero que a interface seja fluida e responsiva, para que interações como scroll, likes e navegação não apresentem travamentos.

#### Critérios de Aceitação

1. WHEN um componente de lista renderiza cards de perfil, THE Sistema SHALL utilizar `React.memo` para evitar re-renders quando props não mudam, de forma que o componente não re-renderize mais que 1 vez por mudança de prop observável
2. WHEN um callback é passado como prop para componentes filhos, THE Sistema SHALL utilizar `useCallback` para manter referência estável entre renders enquanto as dependências não mudarem
3. WHEN um cálculo derivado de estado leva mais de 2ms para executar, THE Sistema SHALL utilizar `useMemo` para evitar recálculos a cada render, recalculando apenas quando as dependências do cálculo mudarem
4. THE Sistema SHALL implementar virtualização de lista (virtual scroll) no feed de reels, mantendo no máximo 10 elementos DOM renderizados simultaneamente independente da quantidade total de itens na lista
5. WHEN o componente ProfileCard recebe dados de perfil, THE Sistema SHALL renderizar imagens com `loading="lazy"` e dimensões explícitas (width e height em pixels definidos no elemento), garantindo Cumulative Layout Shift (CLS) inferior a 0.1 conforme medido pelo Lighthouse
6. THE Sistema SHALL evitar prop drilling de mais de 3 níveis, utilizando composição de componentes ou context para dados compartilhados entre 4 ou mais níveis de aninhamento
7. WHILE o usuário realiza scroll no feed de reels, THE Sistema SHALL manter taxa de quadros mínima de 30fps e Interaction to Next Paint (INP) inferior a 200ms

### Requisito 9: Suspense e Streaming

**User Story:** Como usuário, quero ver conteúdo progressivamente enquanto dados carregam, para que a página pareça rápida mesmo com múltiplas fontes de dados.

#### Critérios de Aceitação

1. WHEN a página inicial carrega seções de perfis (em alta, em destaque), THE Sistema SHALL envolver cada seção em `<Suspense>` com fallback de skeleton independente, de modo que cada seção apareça assim que seus dados estiverem prontos sem aguardar as demais seções
2. WHEN a página de perfil público carrega, THE Sistema SHALL utilizar streaming com `<Suspense>` para exibir imediatamente as informações do hero (nome, foto, cidade, preço, selos de verificação) enquanto reviews e galeria de mídia carregam em boundaries separados
3. WHEN a página de descobrir carrega stories e perfis, THE Sistema SHALL renderizar a lista de perfis em `<Suspense>` separado dos stories, permitindo que cada seção apareça independentemente conforme seus dados ficam disponíveis
4. THE Sistema SHALL definir componentes de skeleton específicos para cada seção (ProfileCardSkeleton, StoryBarSkeleton, MediaGallerySkeleton, ReviewSkeleton) que reproduzam a estrutura de layout do conteúdo final com placeholders animados, evitando deslocamento de layout (layout shift) quando o conteúdo real substituir o skeleton
5. IF um erro ocorre dentro de um boundary Suspense, THEN THE Sistema SHALL exibir o error boundary mais próximo com opção de tentar novamente, mantendo as demais seções da página renderizadas e interativas

### Requisito 10: Otimização de Data Fetching

**User Story:** Como desenvolvedor, quero que as requisições de dados sejam eficientes e sem duplicações, para que o servidor e o banco não sejam sobrecarregados com chamadas redundantes.

#### Critérios de Aceitação

1. WHEN múltiplas Server Components na mesma renderização de página invocam a mesma função de busca de dados com os mesmos parâmetros, THE Sistema SHALL utilizar `cache()` do React para deduplicar chamadas ao banco, resultando em uma única query executada por request
2. WHEN a página de perfil público é renderizada, THE Sistema SHALL executar as queries independentes (perfil, stories, subscriber status) em paralelo com `Promise.all`, de modo que o tempo total de resposta não exceda o tempo da query mais lenta acrescido de 50ms de overhead
3. IF uma das queries paralelas falhar durante a renderização da página de perfil público, THEN THE Sistema SHALL renderizar a página com os dados disponíveis das queries bem-sucedidas e exibir um estado de erro parcial apenas na seção afetada
4. THE API_Router SHALL implementar paginação baseada em cursor para endpoints que retornam listas (reels, comentários, perfis), retornando no payload um campo `nextCursor` (string ou null) e um campo booleano `hasMore` indicando se existem mais registros
5. WHEN o cliente faz scroll infinito, THE Sistema SHALL carregar o próximo lote de dados via API utilizando o cursor retornado na resposta anterior, com um tamanho de lote padrão de 10 itens para reels e 20 itens para comentários
6. THE Sistema SHALL evitar queries N+1 utilizando `include` ou `select` com relações no Prisma em vez de loops com queries individuais, garantindo que cada endpoint execute no máximo 3 queries ao banco por requisição
7. WHEN dados de listagem são requisitados, THE Query_Layer SHALL limitar o número máximo de registros retornados a 60 por página, independentemente do valor solicitado pelo cliente

### Requisito 11: Otimização de Bundle e Assets

**User Story:** Como usuário mobile, quero que a aplicação carregue rapidamente mesmo em conexões lentas, para que eu possa acessar perfis e navegar sem frustração.

#### Critérios de Aceitação

1. THE Sistema SHALL utilizar `next/image` com formatos modernos (WebP/AVIF) e propriedade `sizes` com breakpoints correspondentes ao layout responsivo (ex: 100vw em mobile, 50vw em tablet, 33vw em desktop) para todas as imagens de perfil e mídia
2. WHEN imagens são renderizadas em cards de listagem, THE Sistema SHALL definir a prop `sizes` de forma que a imagem baixada não exceda 2x a largura de exibição do card no viewport atual do dispositivo
3. THE Sistema SHALL gerar blur placeholders (blurDataURL) com dimensão máxima de 10x10 pixels codificados em base64 para imagens de perfil durante o upload e armazená-los no banco
4. THE Bundle SHALL importar ícones do lucide-react individualmente em vez de importar o pacote inteiro
5. THE Sistema SHALL configurar `optimizePackageImports` no `next.config.ts` para pacotes com muitos exports (lucide-react, recharts)
6. WHEN fontes são carregadas, THE Sistema SHALL utilizar `next/font` com `display: swap` e preload, garantindo que o texto permaneça visível durante o carregamento da fonte (sem período de invisibilidade superior a 100ms)
7. IF uma imagem falhar ao carregar (erro de rede ou URL inválida), THEN THE Sistema SHALL exibir um placeholder visual estático com as mesmas dimensões do espaço reservado, sem causar layout shift
8. WHEN a página de listagem é carregada em conexão 3G simulada (throughput de 750kbps), THE Sistema SHALL apresentar o Largest Contentful Paint (LCP) em no máximo 4 segundos

### Requisito 12: SEO e Core Web Vitals

**User Story:** Como operador da plataforma, quero que as páginas públicas tenham bom SEO e métricas de Core Web Vitals, para que a plataforma tenha boa visibilidade em buscadores e experiência de usuário mensurável.

#### Critérios de Aceitação

1. THE Sistema SHALL gerar metadata dinâmica (title com no máximo 60 caracteres, description com no máximo 160 caracteres, og:image) para páginas de perfil público e páginas de cidade
2. THE Sistema SHALL gerar um sitemap dinâmico (`/sitemap.xml`) válido conforme o protocolo Sitemaps XML, contendo URLs de perfis públicos ativos e páginas de cidade
3. WHEN a página de perfil público é renderizada, THE Sistema SHALL atingir LCP (Largest Contentful Paint) inferior a 2.5 segundos no percentil 75 (p75) medido em condições de rede 4G simulada
4. THE Sistema SHALL atingir CLS (Cumulative Layout Shift) inferior a 0.1 no percentil 75 (p75) em todas as páginas públicas
5. THE Sistema SHALL atingir INP (Interaction to Next Paint) inferior a 200ms no percentil 75 (p75) em interações de filtro e navegação
6. WHEN uma página pública de perfil é renderizada, THE Sistema SHALL incluir dados estruturados (JSON-LD) com schema.org LocalBusiness contendo no mínimo os campos obrigatórios: name, address e url, validáveis sem erros pela ferramenta Rich Results Test do Google
7. IF os dados do perfil estiverem incompletos (sem descrição ou sem foto), THEN THE Sistema SHALL gerar metadata com valores fallback genéricos baseados no nome do perfil e na cidade, sem deixar campos title ou description vazios

### Requisito 13: Eliminação de Código Redundante e Memory Leaks

**User Story:** Como desenvolvedor, quero que a base de código seja limpa e sem vazamentos de memória, para que a aplicação seja estável em produção e fácil de manter.

#### Critérios de Aceitação

1. WHEN a migração para a camada de serviços em `src/lib/services/` estiver completa para um dado módulo (perfis, assinaturas, mídia, cidades, verificação, financeiro, suporte), THE Sistema SHALL remover as funções correspondentes de `queries.ts`, garantindo que nenhum import de `@/lib/queries` permaneça na base de código para funções já disponíveis em `@/lib/services`
2. WHEN um componente utiliza `setInterval`, `setTimeout` ou event listeners registrados via `addEventListener`, THE Sistema SHALL retornar uma função de cleanup no `useEffect` que invoque `clearInterval`, `clearTimeout` ou `removeEventListener` respectivamente, de modo que nenhum timer ou listener persista após a desmontagem do componente
3. THE Sistema SHALL passar sem erros na verificação de lint com regras `no-unused-vars` e `no-unused-imports` habilitadas, resultando em zero imports não utilizados e zero variáveis declaradas mas não referenciadas em toda a base de código
4. WHEN o componente `ProviderHeartbeat` é desmontado, THE Sistema SHALL cancelar o `setInterval` ativo via a função de cleanup do `useEffect`, garantindo que nenhuma requisição POST para `/api/provider/heartbeat` seja disparada após a desmontagem
5. THE Sistema SHALL consolidar funções utilitárias duplicadas de formatação de data (como `fmtDate` presente em `midias-manager.tsx` e `media-gallery.tsx`) em um módulo único em `src/lib/`, e cada componente SHALL importar a função do módulo centralizado em vez de redeclará-la localmente
6. IF um componente é desmontado durante uma requisição fetch pendente iniciada dentro de um `useEffect`, THEN THE Sistema SHALL cancelar a requisição via `AbortController.abort()` para evitar chamadas a `setState` em componentes desmontados, aplicando-se a todo fetch que dependa do ciclo de vida do componente (excluindo fetches disparados por ação explícita do usuário como cliques)
7. IF a verificação de lint identificar imports circulares entre `queries.ts` e `src/lib/services/`, THEN THE Sistema SHALL resolver a dependência circular antes de remover as funções duplicadas, garantindo que o build compile sem erros

### Requisito 14: Performance Mobile

**User Story:** Como usuário mobile, quero que a aplicação seja otimizada para dispositivos com recursos limitados, para que a experiência seja fluida em smartphones.

#### Critérios de Aceitação

1. WHEN a página é acessada em viewport mobile (< 768px), THE Sistema SHALL carregar imagens com resolução máxima igual à largura do viewport do dispositivo multiplicada pelo device pixel ratio, utilizando atributo `sizes` responsivo
2. THE Sistema SHALL implementar `touch-action: manipulation` em todos os elementos clicáveis (botões, links, inputs e elementos com role interativo) para eliminar delay de 300ms em toque
3. WHEN o feed de reels é exibido em mobile, THE Sistema SHALL carregar no máximo 3 vídeos simultaneamente e pausar vídeos fora da viewport
4. THE Sistema SHALL utilizar `will-change` e `transform` para animações em vez de propriedades que causam reflow (width, height, top, left)
5. WHEN o usuário navega entre páginas, THE Sistema SHALL utilizar prefetch de links visíveis na viewport, de modo que a navegação subsequente apresente tempo de carregamento inferior a 1 segundo
6. IF o prefetch de um link falhar, THEN THE Sistema SHALL realizar a navegação padrão sem prefetch, sem exibir erro ao usuário
7. WHILE o viewport é inferior a 768px, THE Sistema SHALL manter o tempo de interação (TTI) inferior a 3.5 segundos em conexão 4G simulada com throughput de 9 Mbps de download, 1.5 Mbps de upload e latência de 170ms (perfil Lighthouse 4G throttling)

### Requisito 15: Documentação de Melhorias e Métricas

**User Story:** Como operador da plataforma, quero documentação clara das melhorias realizadas e seu impacto, para que eu possa acompanhar a evolução técnica e justificar investimentos.

#### Critérios de Aceitação

1. WHEN uma otimização é implementada, THE Sistema SHALL registrar em documento de changelog: descrição da melhoria (máximo 500 caracteres), métrica antes, métrica depois e variação percentual do indicador afetado
2. WHEN o build é executado com sucesso, THE Sistema SHALL medir e documentar: tempo médio de resposta (percentil 95) das APIs `getProfileBySlug`, `listProfilesForCity` e `listReels`, tamanho do bundle por rota em kilobytes, e scores de Core Web Vitals (LCP, CLS e INP)
3. WHEN o build é executado, THE Sistema SHALL gerar relatório de tamanho de bundle por rota via `next build` com análise de output
4. THE Sistema SHALL definir baselines de performance medidas no percentil 95 em ambiente de produção para: tempo de resposta de `getProfileBySlug` (< 100ms), `listProfilesForCity` (< 200ms), e `listReels` (< 150ms)
5. WHEN uma decisão arquitetural é tomada durante uma otimização, THE Sistema SHALL documentar em registro de ADR (Architecture Decision Record): contexto do problema, decisão tomada, alternativas consideradas (mínimo 1 alternativa) e trade-offs identificados
6. THE Sistema SHALL definir thresholds aceitáveis para Core Web Vitals: LCP inferior a 2500ms, CLS inferior a 0.1, e INP inferior a 200ms
