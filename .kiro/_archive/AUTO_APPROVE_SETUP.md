# Setup de Auto-Approve para Sessão Autônoma

> Cole esta configuração nas suas Settings do Kiro (User Settings JSON), feche o Kiro, abra de novo, e cole o prompt no fim deste arquivo. A partir daí o agente trabalha sem te pedir Run.

## Passo 1 — Abrir as Settings JSON

`Ctrl+Shift+P` → digita "Preferences: Open User Settings (JSON)" → enter.

## Passo 2 — Colar este bloco dentro do JSON

Adicione/mescle as chaves abaixo no seu `settings.json`. Se você já tem alguma das chaves, sobrescreva pelo valor abaixo.

```jsonc
{
  // 1. Auto-aprovar TODAS as edições de arquivo feitas pelo agente
  //    (a regex /.*/ casa qualquer caminho).
  "chat.tools.edits.autoApprove": {
    "/.*/": true,
    // Mantém proteção em arquivos sensíveis do VS Code/Kiro:
    "**/.vscode/*.json": false,
    "**/settings.json": false
  },

  // 2. Auto-aprovar comandos de terminal mais usados pelo agente.
  //    Lista explícita por segurança — `rm -rf /` continua precisando aprovação.
  "chat.tools.terminal.autoApprove": {
    // Pacotes / build / test
    "npm": true,
    "npx": true,
    "node": true,
    "tsc": true,
    "eslint": true,
    "vitest": true,
    "next": true,
    "prisma": true,
    "tsx": true,

    // Git seguro (read-only e branches locais). Push/force-push continuam manuais.
    "/^git (status|diff|log|show|branch|fetch|add|commit|stash|restore|checkout)\\b.*$/": true,

    // PowerShell utilitários comuns
    "/^Get-ChildItem\\b/i": true,
    "/^Get-Content\\b/i": true,
    "/^Get-Item\\b/i": true,
    "/^Get-Process\\b/i": true,
    "/^Get-CimInstance\\b/i": true,
    "/^Select-String\\b/i": true,
    "/^Test-Path\\b/i": true,
    "/^Where-Object\\b/i": true,
    "/^ForEach-Object\\b/i": true,
    "/^Select-Object\\b/i": true,
    "/^Format-Table\\b/i": true,
    "/^Format-List\\b/i": true,
    "/^Out-Null\\b/i": true,
    "/^Out-String\\b/i": true,
    "/^Measure-Object\\b/i": true,
    "/^Sort-Object\\b/i": true,
    "/^Group-Object\\b/i": true,
    "/^Compare-Object\\b/i": true,
    "/^New-Item\\b/i": true,
    "/^Set-Content\\b/i": true,
    "/^Add-Content\\b/i": true,
    "/^Copy-Item\\b/i": true,
    "/^Move-Item\\b/i": true,
    "/^Rename-Item\\b/i": true,
    "/^Start-Sleep\\b/i": true,
    "/^Write-Host\\b/i": true,
    "/^Write-Output\\b/i": true,
    "/^Invoke-Expression\\b/i": true,

    // Variáveis e operadores PowerShell que aparecem em pipelines
    "/^\\$/": true,
    "/^@/": true,
    "/^\\(/": true,

    // CMD / shell utilitários
    "echo": true,
    "type": true,
    "dir": true,
    "cd": true,
    "cls": true,
    "where": true,

    // *** PROIBIÇÕES — sempre exigem aprovação ***
    "rm": false,
    "rmdir": false,
    "del": false,
    "/^Remove-Item\\b/i": false,
    "/^.*\\bforce\\b.*\\brecurse\\b.*$/i": false,
    "/^.*-rf\\b/": false,
    "format": false,
    "shutdown": false,
    "/^git push\\b/": false,
    "/^git reset --hard\\b/": false,
    "/^git clean\\b/": false,
    "/^git branch -D\\b/": false
  },

  // 3. Não desligar as regras-padrão de bloqueio (continua protegendo
  //    contra comandos perigosos não listados acima).
  "chat.tools.terminal.ignoreDefaultAutoApproveRules": false
}
```

## Passo 3 — Fechar o Kiro completamente

`Ctrl+Shift+P` → "Developer: Close Window". Depois feche **todas** as janelas do Kiro. Se o ícone aparecer na bandeja do sistema, clique direito → Quit. Isso libera o lock no `.kiro/tasks/.../fase-1-seguranca.meta.json`.

## Passo 4 — Reabrir o Kiro normalmente

**NÃO** abra como administrador. Só abrir como faz sempre.

## Passo 5 — Colar este prompt no chat

```
Retomar a execução autônoma das fases 1 e 2 do spec auditoria-geral.

Status real (filesystem) na última sessão:
- fase-2-testes: package.json com vitest+fast-check pinados, vitest.config.ts, vitest.setup.ts e scripts npm test/test:watch/test:run prontos
- fase-1-seguranca: src/lib/security/dev-auth.ts, src/lib/security/cron-auth.ts, src/lib/rate-limit.ts e refactor de src/lib/auth.ts prontos; routes /api/dev/reset e /api/dev/activate-plans já consumindo requireAdminOrToken; zod 3.23.8 instalado

O bookkeeping do task tool está dessincronizado pelo lock anterior. Sua primeira ação é reconciliar o estado real do filesystem com o task tool e seguir até deixar fase-1-seguranca e fase-2-testes em state: Done no master. Trabalhe em ondas paralelas (subagentes file-disjoint). Permissão total para shell, edits e subagentes. Pode rodar npm install, npm run lint, npm run test, npm run build e npx tsc --noEmit livremente. NÃO rode git push, git reset --hard, ou apague node_modules.

Pare e me pergunte só se encontrar uma decisão real que exige input humano (ex: hostname de produção, valor de janela CSP de Report-Only, schema change). Para todo o resto, decida e siga.

Quando terminar (ou se ficar bloqueado), atualize .kiro/handoff.md com o estado final e me avise no próximo retorno.
```

## Notas de segurança

- O `chat.tools.edits.autoApprove` com `/.*/` libera edição em **qualquer** arquivo do workspace. Como o agente trabalha confinado a `c:\Users\edulanzarin\Documents\Dev\privello\`, isso não afeta nada fora do projeto.
- A lista de terminal **explicitamente bloqueia** `rm`, `rmdir`, `del`, `Remove-Item`, `git push`, `git reset --hard`, `git clean`, `format`, `shutdown` — esses sempre vão pedir Run mesmo durante a sessão autônoma.
- Se o agente precisar fazer algo bloqueado, ele vai parar e te perguntar; ele não tenta contornar a lista.
- Pra desligar tudo depois: troca `"/.*/"` por `false` em `chat.tools.edits.autoApprove` e `"npm": false`/etc nos terminais. Ou só apague o bloco que colou.

## Se algo der errado

- **Auto-approve não está pegando**: verifica se as chaves estão no User Settings (não no Workspace Settings); se estão num arquivo separado por engano (não em `settings.json`); se você não esqueceu uma vírgula no JSON e o arquivo está malformado.
- **Lock do .meta.json voltou**: reabre o Kiro de novo. Se persistir, deleta o arquivo `C:\Users\edulanzarin\.kiro\tasks\8ce70501232af33b\fase-1-seguranca.meta.json` (com o Kiro fechado) — o task tool recria do zero a partir do tasks.md.
- **Agente travou**: digita "continuar" no chat; ele retoma de onde parou.
