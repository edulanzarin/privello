/**
 * check-no-raw-palette.test.ts
 * ────────────────────────────────────────────────────────────────────────────
 * Tests for the raw-palette lint guard (Property 10 / Requirement 17.4).
 *
 * Cobre:
 *   - Caso negativo (arquivo limpo) → exit 0
 *   - Caso positivo raw palette (`bg-zinc-50`) → exit 1, match reportado
 *   - Caso positivo outline removido sem ring → exit 1
 *   - Caso outline-none com focus-visible:ring na mesma linha → exit 0
 *   - --report-only nunca falha mesmo com violações
 *
 * Validates: Requirements 17.1, 17.2, 17.4
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

const SCRIPT = path.resolve(process.cwd(), "scripts", "check-no-raw-palette.mjs");

interface ScriptResult {
    status: number | null;
    stdout: string;
    stderr: string;
}

function runScript(args: string[], cwd: string): ScriptResult {
    const res = spawnSync(process.execPath, [SCRIPT, "--json", ...args], {
        cwd,
        encoding: "utf8",
    });
    return { status: res.status, stdout: res.stdout, stderr: res.stderr };
}

function makeTempDir(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), "raw-palette-guard-"));
}

describe("check-no-raw-palette", () => {
    let tmp: string;

    beforeEach(() => {
        tmp = makeTempDir();
    });

    afterEach(() => {
        if (tmp && fs.existsSync(tmp)) {
            fs.rmSync(tmp, { recursive: true, force: true });
        }
    });

    it("exits 0 when scanning a clean file (no raw palette, no outline:none)", () => {
        const file = path.join(tmp, "clean.tsx");
        fs.writeFileSync(
            file,
            `export const Foo = () => <div className="bg-background text-foreground border-line">ok</div>;\n`,
        );
        const res = runScript([file], tmp);
        expect(res.status).toBe(0);
        const payload = JSON.parse(res.stdout);
        expect(payload.ok).toBe(true);
        expect(payload.violationCount).toBe(0);
    });

    it("exits 1 when a file uses bg-zinc-50 (raw palette)", () => {
        const file = path.join(tmp, "violator.tsx");
        fs.writeFileSync(
            file,
            `export const Bad = () => <div className="bg-zinc-50 text-amber-600">no</div>;\n`,
        );
        const res = runScript([file], tmp);
        expect(res.status).toBe(1);
        const payload = JSON.parse(res.stdout);
        expect(payload.ok).toBe(false);
        expect(payload.violationCount).toBeGreaterThanOrEqual(2);
        const matches = payload.violations.map((v: { match: string }) => v.match);
        expect(matches).toContain("bg-zinc-50");
        expect(matches).toContain("text-amber-600");
        expect(
            payload.violations.every(
                (v: { kind: string }) => v.kind === "raw-palette",
            ),
        ).toBe(true);
    });

    it("exits 1 for ring/from/to/via raw palettes", () => {
        const file = path.join(tmp, "gradients.tsx");
        fs.writeFileSync(
            file,
            `export const Grad = () => <div className="from-sky-100 via-emerald-200 to-rose-300 ring-fuchsia-400">x</div>;\n`,
        );
        const res = runScript([file], tmp);
        expect(res.status).toBe(1);
        const payload = JSON.parse(res.stdout);
        expect(payload.violationCount).toBe(4);
    });

    it("exits 1 for outline:none without focus-visible:ring", () => {
        const file = path.join(tmp, "outline.tsx");
        fs.writeFileSync(
            file,
            `export const Btn = () => <button style={{ outline: "none" }}>x</button>;\n`,
        );
        const res = runScript([file], tmp);
        expect(res.status).toBe(1);
        const payload = JSON.parse(res.stdout);
        expect(
            payload.violations.some(
                (v: { kind: string }) => v.kind === "outline-none-no-ring",
            ),
        ).toBe(true);
    });

    it("exits 0 when outline-none is paired with focus-visible:ring on same line", () => {
        const file = path.join(tmp, "outline-ok.tsx");
        fs.writeFileSync(
            file,
            `export const Btn = () => <button className="outline-none focus-visible:ring-2 focus-visible:ring-blue/40">x</button>;\n`,
        );
        const res = runScript([file], tmp);
        expect(res.status).toBe(0);
        const payload = JSON.parse(res.stdout);
        expect(payload.ok).toBe(true);
    });

    it("--report-only never fails the process even with violations", () => {
        const file = path.join(tmp, "violator.tsx");
        fs.writeFileSync(
            file,
            `export const Bad = () => <div className="bg-zinc-50">no</div>;\n`,
        );
        const res = runScript(["--report-only", file], tmp);
        expect(res.status).toBe(0);
        const payload = JSON.parse(res.stdout);
        expect(payload.ok).toBe(false);
        expect(payload.violationCount).toBeGreaterThanOrEqual(1);
    });

    it("does not match unrelated identifiers (no digit suffix or non-banned color)", () => {
        const file = path.join(tmp, "noise.tsx");
        fs.writeFileSync(
            file,
            `export const X = () => <div className="bg-zinc text-slate notmatching-50 bg-blue-50">y</div>;\n`,
        );
        // bg-blue-50 is NOT in the banned list (blue is a semantic token, not raw palette);
        // bg-zinc / text-slate have no digit suffix.
        const res = runScript([file], tmp);
        expect(res.status).toBe(0);
        const payload = JSON.parse(res.stdout);
        expect(payload.ok).toBe(true);
    });
});
