/**
 * Sender de e-mails transacionais
 *
 * Caminho: src/lib/email.ts
 *
 * Inicializa um `nodemailer` Transport a partir das variáveis de ambiente
 * (`EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASS`,
 * `EMAIL_FROM`) e expõe `sendEmail` como única superfície pública. Quando
 * as credenciais não estão configuradas (dev local sem SMTP), `sendEmail`
 * cai em modo console-log, sem disparar tráfego de rede.
 *
 * Convenções:
 * - Server-only (importa `nodemailer`). Não pode rodar em Client Component.
 * - Stateless do ponto de vista do app: o transporter é criado uma única
 *   vez no carregamento do módulo.
 * - Conteúdo HTML deve vir pronto (ver `src/lib/email-templates.ts`).
 *
 * Cross-refs:
 * - src/lib/email-templates.ts — fábricas HTML usadas como `html` no envio.
 * - src/app/_actions/password-reset.ts — `requestPasswordReset` dispara
 *   `passwordResetTemplate`.
 * - src/app/_actions/admin-moderation.ts — fluxos de advertência, suspensão
 *   e reativação disparam `warningTemplate` / `suspensionTemplate` /
 *   `unsuspensionTemplate`.
 * - docs/env.md — variáveis `EMAIL_*`.
 */

import nodemailer from "nodemailer";

const configured = !!(
  process.env.EMAIL_HOST &&
  process.env.EMAIL_USER &&
  process.env.EMAIL_PASS
);

const transporter = configured
  ? nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT ?? 587),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
  : null;

/**
 * Envia um e-mail HTML via SMTP configurado em `EMAIL_*`. Sem credenciais,
 * apenas loga no console (modo dev), preservando o fluxo do chamador sem
 * erros e sem tráfego externo.
 *
 * @param params.to - Destinatário (e-mail único).
 * @param params.subject - Assunto do e-mail (já localizado em pt-BR pelo
 *   chamador).
 * @param params.html - Corpo HTML pronto. Tipicamente vem de uma fábrica em
 *   `src/lib/email-templates.ts`.
 * @returns `Promise<void>`. Não retorna o `info` do nodemailer — chamadores
 *   atuais só precisam saber que o envio foi tentado.
 *
 * @example
 * await sendEmail({
 *   to: "user@exemplo.com",
 *   subject: "Redefinir senha — Privello",
 *   html: passwordResetTemplate(resetUrl),
 * });
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!transporter) {
    console.log(`[Email DEV] Para: ${to} | Assunto: ${subject}`);
    return;
  }
  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? "Privello <contato.privello@gmail.com>",
    to,
    subject,
    html,
  });
}
