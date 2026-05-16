#!/usr/bin/env node
/**
 * Migra hex literais e text-[Npx] para tokens semânticos do design system.
 *
 * Uso:
 *   node scripts/migrate-tokens.mjs <arquivo1> [arquivo2] ...
 *   node scripts/migrate-tokens.mjs --check <arquivo1> ...   # dry-run, retorna stats
 *
 * O script é conservador: aplica apenas substituições onde o padrão é
 * inequívoco (ex.: `text-[14px]` → `text-md`). Não toca sequências dentro
 * de strings de URL, regex literais, comentários SQL.
 */

import fs from "node:fs";
import path from "node:path";

// Mapa de hex → classes alvo (token semântico raiz). Para opacidades, o
// substituidor usa regex específico abaixo.
const HEX_TOKEN_MAP = {
    "#0a84ff": "blue",
    "#007aff": "blue",
    "#ff3b30": "danger",
    "#ff9500": "warning",
    "#ff9f0a": "warning",
    "#30d158": "success",
    "#248a3d": "success-dark",
    "#b36200": "warning-dark",
    "#ff375f": "coral",
    "#e05c5c": "coral",
    "#1d1d1f": "foreground",
    "#1a1a1a": "foreground",
    "#86868b": "muted",
    "#8e8e93": "muted",
    "#d2d2d7": "line",
    "#f5f5f7": "background",
    "#5856d6": "accent-purple",
};

// Mapa de text-[Npx] → classe da escala
// Sizes intermediários mapeiam para o token mais próximo (decisão consciente,
// registrada em tokens.md > Migration log).
const FONT_SIZE_MAP = {
    "9px": "2xs",
    "10px": "2xs",
    "10.5px": "2xs",
    "11px": "xs",
    "11.5px": "xs",
    "12px": "sm",
    "12.5px": "sm",
    "13px": "base",
    "13.5px": "base",
    "14px": "md",
    "14.5px": "md",
    "15px": "lg",
    "15.5px": "lg",
    "16px": "xl",
    "17px": "xl",
    "18px": "2xl",
    "19px": "2xl",
    "20px": "2xl",
    "21px": "3xl",
    "22px": "3xl",
    "23px": "3xl",
    "24px": "3xl",
    "25px": "3xl",
    "26px": "4xl",
    "27px": "4xl",
    "28px": "4xl",
    "30px": "4xl",
    "32px": "4xl",
    "34px": "4xl",
    "36px": "4xl",
    "38px": "4xl",
    "40px": "4xl",
};

/**
 * Substitui ocorrências de hex em padrões comuns:
 *   bg-[#0a84ff]            → bg-blue
 *   bg-[#0a84ff]/10         → bg-blue/10
 *   bg-[#0a84ff]/[0.04]     → bg-blue/[0.04]
 *   text-[#ff3b30]          → text-danger
 *   border-[#d2d2d7]        → border-line
 *   border-[#d2d2d7]/40     → border-line/40
 *   ring-[#ff3b30]          → ring-danger
 *   from-[#0a84ff], to-[#0a84ff], via-[...] (gradientes)
 *
 * Hex contidos em strings JS (entre aspas) NÃO são substituídos pelo script.
 * Isso protege paletas de chart, conteúdo de email, regex literals.
 */
function replaceHex(text) {
    let count = 0;
    const prefixes = [
        "bg",
        "text",
        "border",
        "ring",
        "from",
        "to",
        "via",
        "fill",
        "stroke",
        "shadow",
        "outline",
        "decoration",
        "placeholder",
        "caret",
        "accent",
        "divide",
    ];
    for (const prefix of prefixes) {
        for (const [hex, token] of Object.entries(HEX_TOKEN_MAP)) {
            const escapedHex = hex.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            // Padrão: prefix-[#abc123]
            const re1 = new RegExp(`${prefix}-\\[${escapedHex}\\]`, "g");
            text = text.replace(re1, () => {
                count++;
                return `${prefix}-${token}`;
            });
            // Padrão: prefix-[#abc123]/<percent ou [decimal]>
            const re2 = new RegExp(
                `${prefix}-\\[${escapedHex}\\]/(\\[[\\d.]+\\]|\\d+)`,
                "g",
            );
            text = text.replace(re2, (_m, op) => {
                count++;
                return `${prefix}-${token}/${op}`;
            });
        }
    }
    return { text, count };
}

function replaceFontSize(text) {
    let count = 0;
    for (const [px, klass] of Object.entries(FONT_SIZE_MAP)) {
        const re = new RegExp(`text-\\[${px.replace(/\./g, "\\.")}\\]`, "g");
        text = text.replace(re, () => {
            count++;
            return `text-${klass}`;
        });
    }
    return { text, count };
}

function processFile(file, check) {
    const original = fs.readFileSync(file, "utf8");
    let text = original;
    const r1 = replaceHex(text);
    text = r1.text;
    const r2 = replaceFontSize(text);
    text = r2.text;

    const remainHex = (text.match(/-\[#[0-9a-fA-F]{3,8}\]/g) || []).length;
    const remainFont = (text.match(/text-\[\d+(?:\.\d+)?(?:px|rem|em)\]/g) || []).length;

    if (!check && text !== original) {
        fs.writeFileSync(file, text);
    }
    return {
        file,
        hexReplaced: r1.count,
        fontReplaced: r2.count,
        remainHex,
        remainFont,
        changed: text !== original,
    };
}

function main() {
    const args = process.argv.slice(2);
    const check = args.includes("--check");
    const files = args.filter((a) => a !== "--check");
    if (files.length === 0) {
        console.error("Uso: node scripts/migrate-tokens.mjs [--check] <arquivo>...");
        process.exit(1);
    }
    const results = [];
    for (const f of files) {
        if (!fs.existsSync(f)) {
            console.error(`Arquivo não encontrado: ${f}`);
            continue;
        }
        results.push(processFile(f, check));
    }
    let totalHex = 0;
    let totalFont = 0;
    let totalRemainHex = 0;
    let totalRemainFont = 0;
    for (const r of results) {
        totalHex += r.hexReplaced;
        totalFont += r.fontReplaced;
        totalRemainHex += r.remainHex;
        totalRemainFont += r.remainFont;
        if (r.changed || r.remainHex > 0 || r.remainFont > 0) {
            console.log(
                `${r.file}: hex ${r.hexReplaced} replaced, font ${r.fontReplaced} replaced, remain hex=${r.remainHex} font=${r.remainFont}`,
            );
        }
    }
    console.log(
        `TOTAL: hex_replaced=${totalHex} font_replaced=${totalFont} remain_hex=${totalRemainHex} remain_font=${totalRemainFont}`,
    );
}

main();
