import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  // ── Fase 4 — Lint anti-regressão de tokens semânticos e escala tipográfica ──
  // Documentação: .kiro/specs/fase-4-design-system/tokens.md > Lint anti-regressão.
  // Esta regra impede a reintrodução de hex literais (`#rrggbb`, `#rgb`) e classes
  // Tailwind de tamanho de fonte arbitrário (`text-[Npx]`, `text-[Nrem]`, `text-[Nem]`)
  // em código de produto. Tokens semânticos e a escala canônica (`text-2xs` ... `text-4xl`)
  // estão definidos em `src/app/globals.css`.
  {
    files: ["src/components/**/*.{ts,tsx}", "src/app/**/*.{ts,tsx}"],
    ignores: [
      // HTML para email não suporta CSS variables na maioria dos clientes.
      "src/lib/email-templates.ts",
      // Cores de visualização de dados (recharts) — não pertencem à paleta semântica.
      "src/components/admin/admin-charts.tsx",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/#[0-9a-fA-F]{3,8}\\b/]",
          message:
            "Hex literais não são permitidos em código de produto. Use tokens semânticos (text-coral, bg-blue, border-success, text-warning, text-danger, bg-background, bg-foreground, text-muted, border-line). Veja .kiro/specs/fase-4-design-system/tokens.md.",
        },
        {
          selector: "Literal[value=/text-\\[\\d+(\\.\\d+)?(px|rem|em)\\]/]",
          message:
            "Tamanho de fonte arbitrário não é permitido. Use a escala canônica: text-2xs (10px), text-xs (11px), text-sm (12px), text-base (13px), text-md (14px), text-lg (15px), text-xl (16px), text-2xl (18px), text-3xl (22px), text-4xl (28px). Veja .kiro/specs/fase-4-design-system/tokens.md.",
        },
        {
          selector: "TemplateElement[value.cooked=/#[0-9a-fA-F]{3,8}\\b/]",
          message:
            "Hex literais não são permitidos em template strings. Use tokens semânticos. Veja .kiro/specs/fase-4-design-system/tokens.md.",
        },
        {
          selector: "TemplateElement[value.cooked=/text-\\[\\d+(\\.\\d+)?(px|rem|em)\\]/]",
          message:
            "Tamanho de fonte arbitrário não é permitido em template strings. Use a escala canônica. Veja .kiro/specs/fase-4-design-system/tokens.md.",
        },
      ],
    },
  },
]);

export default eslintConfig;
