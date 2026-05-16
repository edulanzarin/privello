#!/usr/bin/env node
/**
 * scripts/fix-mojibake.mjs
 *
 * Conserta mojibake UTF-8 (texto que foi salvo como UTF-8, depois lido como
 * Windows-1252, depois re-salvo como UTF-8). O fix correto e re-codificar
 * como CP1252 e depois interpretar como UTF-8.
 *
 * Detector: procura substrings inequivocas de mojibake portugues-BR no texto
 * UTF-8 atual. Se qualquer uma aparece, o arquivo e mojibake.
 *
 * Uso:
 *   node scripts/fix-mojibake.mjs              # dry-run
 *   node scripts/fix-mojibake.mjs --apply      # aplica
 *
 * Preserva BOM UTF-8 (0xEF 0xBB 0xBF) se presente.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const apply = process.argv.includes("--apply");
const root = "src";
const exts = new Set([".ts", ".tsx", ".css", ".md"]);

// Marcadores de mojibake: bytes UTF-8 que representam o estado corrompido
// de letras pt-BR comuns. Cada marcador e codificado como buffer de bytes
// para evitar problemas de encoding do proprio script.
const mojibakeMarkers = [
    // Letras com cedilha/til/acentos: A-til (0xC3 0x83) + Acirc (0xC2 0xXX)
    [0xc3, 0x83, 0xc2, 0xa7], // Ãç
    [0xc3, 0x83, 0xc2, 0xa3], // Ã£
    [0xc3, 0x83, 0xc2, 0xa1], // Ã¡
    [0xc3, 0x83, 0xc2, 0xa9], // Ã©
    [0xc3, 0x83, 0xc2, 0xad], // Ã­
    [0xc3, 0x83, 0xc2, 0xb3], // Ã³
    [0xc3, 0x83, 0xc2, 0xba], // Ãº
    [0xc3, 0x83, 0xc2, 0xa2], // Ã¢
    [0xc3, 0x83, 0xc2, 0xaa], // Ãª
    [0xc3, 0x83, 0xc2, 0xb4], // Ã´
    [0xc3, 0x83, 0xc2, 0xb1], // Ã±
    [0xc3, 0x83, 0xc2, 0x87], // Ã‡
    // Smart quotes / dashes mojibakizados: 0xE2 0x80 (em-dash, en-dash etc)
    // mojibakizado para 0xC3 0xA2 0xE2 0x82 0xAC
    [0xc3, 0xa2, 0xe2, 0x82, 0xac], // â€
    // Box-drawing horizontal mojibakizado
    [0xc3, 0xa2, 0xe2, 0x80, 0x9c, 0xc3, 0xa2], // â"€"
];

function hasMojibake(bytes) {
    for (const marker of mojibakeMarkers) {
        if (bytesContains(bytes, marker)) return true;
    }
    return false;
}

function bytesContains(haystack, needle) {
    outer: for (let i = 0; i <= haystack.length - needle.length; i++) {
        for (let j = 0; j < needle.length; j++) {
            if (haystack[i + j] !== needle[j]) continue outer;
        }
        return true;
    }
    return false;
}

function hasBom(bytes) {
    return bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
}

function* walk(dir) {
    for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        const st = statSync(path);
        if (st.isDirectory()) {
            yield* walk(path);
        } else if (st.isFile() && exts.has(extname(name))) {
            yield path;
        }
    }
}

const BOM = Buffer.from([0xef, 0xbb, 0xbf]);
const affected = [];

for (const path of walk(root)) {
    const raw = readFileSync(path);
    const bom = hasBom(raw);
    const content = bom ? raw.slice(3) : raw;

    if (!hasMojibake(content)) continue;

    // Round-trip: decodificar UTF-8 atual como string -> re-encodar como CP1252.
    // CP1252 difere de Latin-1 nos bytes 0x80-0x9F que mapeiam para codepoints
    // especificos (smart quotes, em-dash, euro, etc). Tabela inversa:
    const utf8Text = new TextDecoder("utf-8").decode(content);
    const cp1252ReverseMap = {
        0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85,
        0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a,
        0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92,
        0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
        0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c,
        0x017e: 0x9e, 0x0178: 0x9f,
    };
    const cp1252Bytes = Buffer.alloc(utf8Text.length * 4);
    let outIdx = 0;
    let conversionFailed = false;
    for (const ch of utf8Text) {
        const cp = ch.codePointAt(0);
        if (cp <= 0xff) {
            cp1252Bytes[outIdx++] = cp;
        } else if (cp1252ReverseMap[cp] !== undefined) {
            cp1252Bytes[outIdx++] = cp1252ReverseMap[cp];
        } else {
            // Codepoint que CP1252 nao consegue representar — abortar
            conversionFailed = true;
            break;
        }
    }
    if (conversionFailed) {
        console.log(`  skip (codepoint nao representavel em CP1252): ${path}`);
        continue;
    }
    const trimmedBytes = cp1252Bytes.slice(0, outIdx);

    // Decodificar permissivamente: bytes invalidos viram U+FFFD.
    const fixedText = new TextDecoder("utf-8").decode(trimmedBytes);
    if (fixedText.includes("\uFFFD")) {
        console.log(`  skip (resultado tem caractere invalido): ${path}`);
        continue;
    }

    if (hasMojibake(trimmedBytes)) {
        console.log(`  unfixable (ainda mojibake apos round-trip): ${path}`);
        continue;
    }

    const finalBytes = bom ? Buffer.concat([BOM, trimmedBytes]) : trimmedBytes;
    affected.push({ path, before: raw.length, after: finalBytes.length, bom });

    if (apply) {
        writeFileSync(path, finalBytes);
        const bomTag = bom ? " [BOM preservado]" : "";
        console.log(`  fixed: ${path}${bomTag}`);
    } else {
        const bomTag = bom ? " [BOM]" : "";
        console.log(`  would fix: ${path}${bomTag} (${raw.length} -> ${finalBytes.length} bytes)`);
    }
}

console.log("");
console.log(`TOTAL afetados: ${affected.length} arquivos`);
if (!apply && affected.length > 0) {
    console.log("Rode com --apply para aplicar o fix.");
}
