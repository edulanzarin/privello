#!/usr/bin/env node
/**
 * check-no-raw-palette.mjs
 * ────────────────────────────────────────────────────────────────────────────
 * Lint guard for the macOS-system redesign (Property 10 / Requirement 17).
 *
 * Rejeita classes Tailwind de paleta crua (zinc/amber/sky/emerald/...) em
 * qualquer arquivo `.ts`/`.tsx` dentro de `src/app/**` ou `src/components/**`,
 * EXCETO em `src/components/ui/**` (primitivos do design system) e em
 * `src/lib/chart-tokens.ts` (tokens de visualização de dados).
 *
 * Também detecta `outline: none` / `outline-none` sem `focus-visible:ring`
 * substituto adjacente (Req 2.9).
 *
 * Uso:
 *   node scripts/check-no-raw-palette.mjs              # strict (exit 1 em violação)
 *   node scripts/check-no-raw-palette.mjs --report-only # apenas reporta (exit 0)
 *   node scripts/check-no-raw-palette.mjs --json       # saída JSON estruturada
 *   node scripts/check-no-raw-palette.mjs path/to/file.tsx [...]  # alvos custom
 *
 * Decisão registrada em .kiro/specs/redesign-macos-system/requirements.md
 * Requirement 17 e tasks.md tarefa 23.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

// ── Regexes ─────────────────────────────────────────────────────────────────
// Property 10 / Req 17.2: classes Tailwind de paleta crua.
const RAW_PALETTE_RE =
    /\b(bg|text|border|ring|from|to|via)-(zinc|amber|sky|emerald|fuchsia|indigo|rose|pink|purple|teal|lime|stone|slate|gray|neutral)-\d+\b/g;

// Req 2.9: outline removido sem ring substituto.
// Detecta tanto `outline: none` (CSS / inline style) quanto `outline-none` (Tailwind).
// Aceita aspas opcionais ao redor de `none` para cobrir JSX `style={{ outline: "none" }}`.
const OUTLINE_NONE_CSS_RE = /outline\s*:\s*['"]?none['"]?\b/g;
const OUTLINE_NONE_CLASS_RE = /\boutline-none\b/g;

// v2 (Tahoe Sensual): tokens v1 banidos fora de `src/components/ui/**`.
// `text-foreground` / `bg-foreground` / `text-muted` / `bg-muted` / `text-coral`/
// `fill-coral` / `bg-coral` / `accent-coral` / `border-coral` / `font-serif` —
// substituídos por `text-ink` / `bg-ink` / `text-ink-dim` / `text-rose` / etc.
const LEGACY_TOKEN_RE =
    /\b(?:text|bg|border|ring|fill|accent|from|to|via)-(?:foreground|muted|coral)(?:\/[\d.]+)?\b|\bfont-serif\b|\bborder-black\/\[0\.0[0-9]+\]/g;

// v2: raw shadow inline `shadow-[0_1px_3px_rgba(0,0,0,...)]` ou variantes
// hardcoded — usar tokens `shadow-[var(--shadow-sm)]`, `shadow-[var(--shadow-md)]`,
// `shadow-[var(--shadow-lg)]`, `shadow-[var(--shadow-hairline)]` em vez.
// Bate em `shadow-[<...rgba...>]` quando o conteudo tem `rgba(`.
const RAW_SHADOW_RE = /shadow-\[[^\]]*rgba\([^\]]*\]/g;

// v2: focus-ring azul de v1 (`focus:shadow-[0_0_0_3px_rgba(10,132,255...]`),
// `focus:border-blue`, `ring-blue`, etc. — substituídos por `ring-rose/40`.
const BLUE_FOCUS_RE =
    /focus:shadow-\[0_0_0_3px_rgba\(10,132,255[^\]]*\]|focus:border-blue\b|focus-within:border-blue\b|focus-within:shadow-\[0_0_0_3px_rgba\(10,132,255[^\]]*\]/g;

// ── Configuração de escopo ──────────────────────────────────────────────────
const ROOT = process.cwd();

const SCAN_ROOTS = [
    path.join("src", "app"),
    path.join("src", "components"),
];

/** Path patterns excluídos do guard (canonical surfaces). */
const EXCLUDE_PATH_PATTERNS = [
    // Primitivos do design system: definem as variantes oficiais.
    /[\\/]src[\\/]components[\\/]ui[\\/]/,
    // Tokens de chart: hex / paleta crua é intencional aqui (recharts).
    /[\\/]src[\\/]lib[\\/]chart-tokens\.ts$/,
    // Skipa testes/PBTs do próprio script (podem incluir fixtures violadoras).
    /\.test\.[mc]?[jt]sx?$/,
    /\.pbt\.[mc]?[jt]sx?$/,
];

const ALLOWED_EXTENSIONS = new Set([".ts", ".tsx"]);

// ── Walker ──────────────────────────────────────────────────────────────────
function* walk(dir) {
    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
        return;
    }
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            yield* walk(full);
        } else if (entry.isFile()) {
            yield full;
        }
    }
}

function shouldScan(file) {
    const ext = path.extname(file);
    if (!ALLOWED_EXTENSIONS.has(ext)) return false;
    const normalized = path.resolve(file);
    return !EXCLUDE_PATH_PATTERNS.some((re) => re.test(normalized));
}

function collectTargets(customTargets) {
    if (customTargets && customTargets.length > 0) {
        const out = [];
        for (const t of customTargets) {
            const abs = path.resolve(t);
            if (!fs.existsSync(abs)) continue;
            const stat = fs.statSync(abs);
            if (stat.isFile()) {
                if (shouldScan(abs)) out.push(abs);
            } else if (stat.isDirectory()) {
                for (const f of walk(abs)) {
                    if (shouldScan(f)) out.push(f);
                }
            }
        }
        return out;
    }
    const out = [];
    for (const root of SCAN_ROOTS) {
        const abs = path.join(ROOT, root);
        if (!fs.existsSync(abs)) continue;
        for (const f of walk(abs)) {
            if (shouldScan(f)) out.push(f);
        }
    }
    return out;
}

// ── Análise ─────────────────────────────────────────────────────────────────
function lineColForOffset(text, offset) {
    let line = 1;
    let lastNl = -1;
    for (let i = 0; i < offset; i++) {
        if (text.charCodeAt(i) === 10 /* \n */) {
            line++;
            lastNl = i;
        }
    }
    return { line, col: offset - lastNl };
}

function findMatches(text, regex) {
    const out = [];
    regex.lastIndex = 0;
    let m;
    while ((m = regex.exec(text)) !== null) {
        out.push({ match: m[0], index: m.index });
        if (m.index === regex.lastIndex) regex.lastIndex++;
    }
    return out;
}

/**
 * Para cada match de `outline-none` / `outline: none`, verifica se há um
 * `focus-visible:ring` ou `focus:ring` na mesma linha (proxy razoável para
 * "ring substituto adjacente").
 */
function outlineWithoutRing(text, regex) {
    const lines = text.split(/\r?\n/);
    const out = [];
    regex.lastIndex = 0;
    let m;
    while ((m = regex.exec(text)) !== null) {
        const { line, col } = lineColForOffset(text, m.index);
        const lineText = lines[line - 1] ?? "";
        const hasRing =
            /focus-visible:ring|focus:ring|focus-visible:outline-/.test(lineText);
        if (!hasRing) {
            out.push({ match: m[0], line, col });
        }
        if (m.index === regex.lastIndex) regex.lastIndex++;
    }
    return out;
}

function analyzeFile(file) {
    const text = fs.readFileSync(file, "utf8");
    // Strip block + line comments antes de checar legacy patterns. Mantém o
    // texto original para line/col reporting via `findMatchesInStripped`.
    const stripped = stripComments(text);
    const violations = [];

    for (const { match, index } of findMatches(text, RAW_PALETTE_RE)) {
        const { line, col } = lineColForOffset(text, index);
        violations.push({
            kind: "raw-palette",
            file,
            line,
            col,
            match,
        });
    }

    // Legacy v1 tokens, raw shadows e blue focus rings: regras de v2. Buscamos
    // no `stripped` para evitar falsos positivos em docstrings explicando "sem
    // font-serif" ou "rejeita text-muted".
    for (const { match, index } of findMatches(stripped, LEGACY_TOKEN_RE)) {
        const { line, col } = lineColForOffset(stripped, index);
        violations.push({
            kind: "legacy-v1-token",
            file,
            line,
            col,
            match,
        });
    }

    for (const { match, index } of findMatches(stripped, RAW_SHADOW_RE)) {
        const { line, col } = lineColForOffset(stripped, index);
        violations.push({
            kind: "raw-shadow",
            file,
            line,
            col,
            match,
        });
    }

    for (const { match, index } of findMatches(stripped, BLUE_FOCUS_RE)) {
        const { line, col } = lineColForOffset(stripped, index);
        violations.push({
            kind: "blue-focus-ring",
            file,
            line,
            col,
            match,
        });
    }

    for (const v of outlineWithoutRing(text, OUTLINE_NONE_CSS_RE)) {
        violations.push({
            kind: "outline-none-no-ring",
            file,
            line: v.line,
            col: v.col,
            match: v.match,
        });
    }
    for (const v of outlineWithoutRing(text, OUTLINE_NONE_CLASS_RE)) {
        violations.push({
            kind: "outline-none-no-ring",
            file,
            line: v.line,
            col: v.col,
            match: v.match,
        });
    }

    return violations;
}

/**
 * Substitui comentários por espaços do mesmo tamanho preservando line numbers
 * e column positions. Usado para checagens v2 (legacy tokens, raw shadows,
 * blue focus) que não devem disparar em docstrings explicando o anti-pattern.
 *
 * Cobre:
 *  - `// line comments`
 *  - `/* block comments *\/`
 *
 * Não tenta parsear strings/regex literals (overkill para este script).
 */
function stripComments(text) {
    let out = "";
    let i = 0;
    const n = text.length;
    while (i < n) {
        const c = text[i];
        const next = i + 1 < n ? text[i + 1] : "";
        if (c === "/" && next === "/") {
            // Line comment until \n
            while (i < n && text[i] !== "\n") {
                out += text[i] === "\n" ? "\n" : " ";
                i++;
            }
        } else if (c === "/" && next === "*") {
            // Block comment until */
            while (i < n) {
                if (text[i] === "*" && text[i + 1] === "/") {
                    out += "  ";
                    i += 2;
                    break;
                }
                out += text[i] === "\n" ? "\n" : " ";
                i++;
            }
        } else {
            out += c;
            i++;
        }
    }
    return out;
}

// ── CLI ─────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
    const flags = { reportOnly: false, json: false };
    const targets = [];
    for (const a of argv) {
        if (a === "--report-only") flags.reportOnly = true;
        else if (a === "--json") flags.json = true;
        else if (a === "--help" || a === "-h") flags.help = true;
        else if (a.startsWith("--")) {
            console.error(`Unknown flag: ${a}`);
            process.exit(2);
        } else {
            targets.push(a);
        }
    }
    return { flags, targets };
}

function printHelp() {
    console.log(`Usage: node scripts/check-no-raw-palette.mjs [--report-only] [--json] [path...]

Verifica que arquivos em src/app/** e src/components/** não contêm classes
Tailwind de paleta crua nem outline:none sem ring substituto.

Flags:
  --report-only   Não falha o processo em violação (exit 0).
  --json          Saída em JSON estruturado.
  -h, --help      Mostra esta ajuda.

Exclusões:
  src/components/ui/**           Primitivos do design system
  src/lib/chart-tokens.ts        Tokens canônicos de chart
  *.test.ts(x), *.pbt.ts(x)      Testes
`);
}

function formatHuman(violations, targetCount) {
    if (violations.length === 0) {
        return `✓ check-no-raw-palette: 0 violations across ${targetCount} files.`;
    }
    const byFile = new Map();
    for (const v of violations) {
        const arr = byFile.get(v.file) ?? [];
        arr.push(v);
        byFile.set(v.file, arr);
    }
    const lines = [];
    for (const [file, vs] of byFile) {
        const rel = path.relative(ROOT, file);
        for (const v of vs) {
            lines.push(`${rel}:${v.line}:${v.col}  [${v.kind}]  ${v.match}`);
        }
    }
    lines.push("");
    lines.push(
        `✗ check-no-raw-palette: ${violations.length} violation(s) in ${byFile.size} file(s) across ${targetCount} scanned.`,
    );
    return lines.join("\n");
}

function main() {
    const { flags, targets } = parseArgs(process.argv.slice(2));
    if (flags.help) {
        printHelp();
        process.exit(0);
    }
    const files = collectTargets(targets);
    const violations = [];
    for (const f of files) {
        violations.push(...analyzeFile(f));
    }

    if (flags.json) {
        const payload = {
            ok: violations.length === 0,
            scanned: files.length,
            violationCount: violations.length,
            violations: violations.map((v) => ({
                ...v,
                file: path.relative(ROOT, v.file),
            })),
        };
        process.stdout.write(JSON.stringify(payload, null, 2) + "\n");
    } else {
        const out = formatHuman(violations, files.length);
        if (violations.length === 0) console.log(out);
        else console.error(out);
    }

    if (violations.length > 0 && !flags.reportOnly) {
        process.exit(1);
    }
    process.exit(0);
}

main();
