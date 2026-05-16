/**
 * Templates HTML de e-mails transacionais
 *
 * Caminho: src/lib/email-templates.ts
 *
 * Fábricas puras que retornam o `html` pronto para `sendEmail`. Cada função
 * cobre um tipo de e-mail disparado pelo backend (recuperação de senha,
 * advertência, suspensão, reativação) e usa a mesma moldura visual (`base`)
 * mais o botão padrão (`btn`).
 *
 * Convenções:
 * - Pure functions: recebem strings, devolvem string HTML. Sem I/O, sem
 *   dependência de Prisma/Auth/Request.
 * - HTML inline-styled (compatível com clientes de e-mail).
 * - Cores e tipografia alinhadas ao design system (Georgia + #1a1a1a +
 *   coral #e85d4a + alerta #c8102e).
 * - O assunto (`subject`) NÃO mora aqui — é definido pelo chamador.
 *
 * Cross-refs:
 * - src/lib/email.ts (`sendEmail`) — consumidor direto; o retorno destas
 *   funções entra no campo `html` do envio.
 * - src/app/_actions/password-reset.ts (`requestPasswordReset`) — usa
 *   `passwordResetTemplate`.
 * - src/app/_actions/admin-moderation.ts (`warnProfile`, `suspendProfile`,
 *   `unsuspendProfile`) — usam `warningTemplate`, `suspensionTemplate`,
 *   `unsuspensionTemplate`.
 */

/**
 * Envoltório HTML compartilhado por todos os templates. Aplica `<head>`,
 * `<body>` com cor de fundo, container centralizado, logotipo e rodapé.
 *
 * @param content - HTML interno do card central (já com headings e CTA).
 * @returns Documento HTML completo (`<!DOCTYPE html>` ...) pronto para envio.
 */
function base(content: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:40px 16px;background:#f9f9f7;font-family:Georgia,serif;color:#1a1a1a;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #e5e5e5;padding:40px;">
    <p style="margin:0 0 32px;font-size:20px;">privello<span style="color:#e85d4a;">.</span></p>
    ${content}
    <hr style="border:none;border-top:1px solid #ebebeb;margin:32px 0 16px;">
    <p style="margin:0;font-size:11px;color:#bbb;">Privello · contato.privello@gmail.com<br>Este email foi enviado automaticamente — não responda.</p>
  </div>
</body>
</html>`;
}

/**
 * Botão CTA padrão (preto, sans-serif, uppercase). Compartilhado por todos
 * os templates.
 *
 * @param href - URL absoluta de destino do botão.
 * @param label - Texto visível do botão.
 * @returns Trecho HTML inline pronto para concatenar no corpo do e-mail.
 */
function btn(href: string, label: string) {
  return `<div style="margin:28px 0;">
    <a href="${href}" style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;padding:14px 28px;font-family:sans-serif;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">${label}</a>
  </div>`;
}

/**
 * Template do e-mail "Redefinir senha — Privello". Disparado pelo fluxo de
 * recuperação de senha quando o usuário pede um novo token.
 *
 * Variáveis interpoladas:
 * - `resetUrl` — URL absoluta `${BASE_URL}/recuperar-senha/<token>`. O token
 *   expira em 1 h (cf. `src/app/_actions/password-reset.ts`).
 *
 * Consumido por: `src/app/_actions/password-reset.ts > requestPasswordReset`.
 *
 * @param resetUrl - URL de redefinição. Já deve incluir o token na rota.
 * @returns HTML completo do e-mail pronto para `sendEmail({ html })`.
 */
export function passwordResetTemplate(resetUrl: string) {
  return base(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:normal;">Redefinir senha</h1>
    <p style="margin:0 0 16px;font-size:14px;color:#666;line-height:1.6;">
      Recebemos um pedido de redefinição de senha para sua conta. Clique no botão abaixo para criar uma nova senha.
    </p>
    <p style="margin:0 0 24px;font-size:12px;color:#999;">O link expira em <strong>1 hora</strong>.</p>
    ${btn(resetUrl, "Redefinir senha")}
    <p style="margin:0;font-size:12px;color:#bbb;">Se você não solicitou a redefinição, ignore este email. Sua senha permanece a mesma.</p>
  `);
}

/**
 * Template do e-mail "Advertência recebida — Privello (N/SUSPENSION_THRESHOLD)".
 * Disparado quando a moderação adiciona uma `Warning` ao perfil. Acima de
 * 2 advertências, o template muda o tom para destacar o risco de suspensão
 * automática (cf. `SUSPENSION_THRESHOLD` em `src/lib/constants.ts`).
 *
 * Variáveis interpoladas:
 * - `name` — `Profile.displayName` do provider advertido.
 * - `reason` — motivo informado pelo admin (já trimmed pelo chamador).
 * - `warningCount` — total de advertências acumuladas (1, 2, 3...).
 * - `panelUrl` — URL absoluta para o painel do provider
 *   (`${APP_URL}/painel`).
 *
 * Consumido por: `src/app/_actions/admin-moderation.ts > warnProfile`.
 *
 * @param name - Nome de exibição do provider.
 * @param reason - Motivo da advertência (texto livre validado pelo schema).
 * @param warningCount - Número total de advertências após esta inclusão.
 * @param panelUrl - URL para o painel do provider.
 * @returns HTML completo do e-mail.
 */
export function warningTemplate(name: string, reason: string, warningCount: number, panelUrl: string) {
  const plural = warningCount === 1 ? "advertência" : "advertências";
  const danger = warningCount >= 2;
  return base(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:normal;">Advertência recebida</h1>
    <p style="margin:0 0 16px;font-size:14px;color:#666;line-height:1.6;">
      Olá, <strong>${name}</strong>. Sua conta recebeu uma advertência da equipe de moderação do Privello.
    </p>
    <div style="border-left:3px solid #c8102e;padding:12px 16px;background:#fdf2f2;margin:0 0 20px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#c8102e;">Motivo</p>
      <p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.6;">${reason}</p>
    </div>
    <p style="margin:0 0 24px;font-size:13px;color:${danger ? "#c8102e" : "#666"};line-height:1.6;">
      ${danger
      ? `<strong>Atenção:</strong> você já acumulou <strong>${warningCount} ${plural}</strong>. Ao atingir 3 advertências sua conta será suspensa automaticamente.`
      : `Esta é sua <strong>${warningCount}ª ${plural === "advertência" ? "advertência" : "advertência"}</strong>. Ao atingir 3 advertências sua conta será suspensa.`
    }
    </p>
    ${btn(panelUrl, "Acessar painel")}
    <p style="margin:0;font-size:12px;color:#bbb;">Em caso de dúvidas, entre em contato pelo suporte.</p>
  `);
}

/**
 * Template do e-mail "Sua conta no Privello foi suspensa". Disparado quando
 * a moderação suspende manualmente o perfil ou quando a 3ª advertência aciona
 * a suspensão automática.
 *
 * Variáveis interpoladas:
 * - `name` — `Profile.displayName` do provider suspenso.
 * - `note` — motivo opcional (admin pode suspender sem nota; quando `null`
 *   o bloco "Motivo" é omitido).
 * - `panelUrl` — URL absoluta para o painel do provider.
 *
 * Consumido por: `src/app/_actions/admin-moderation.ts > suspendProfile` e
 * por `warnProfile` quando o threshold de suspensão é atingido.
 *
 * @param name - Nome de exibição do provider.
 * @param note - Motivo opcional informado pelo admin; `null` omite o bloco.
 * @param panelUrl - URL para o painel do provider.
 * @returns HTML completo do e-mail.
 */
export function suspensionTemplate(name: string, note: string | null, panelUrl: string) {
  return base(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:normal;">Conta suspensa</h1>
    <p style="margin:0 0 16px;font-size:14px;color:#666;line-height:1.6;">
      Olá, <strong>${name}</strong>. Sua conta no Privello foi <strong>suspensa</strong> pela equipe de moderação.
    </p>
    ${note ? `
    <div style="border-left:3px solid #c8102e;padding:12px 16px;background:#fdf2f2;margin:0 0 20px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#c8102e;">Motivo</p>
      <p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.6;">${note}</p>
    </div>` : ""}
    <p style="margin:0 0 24px;font-size:13px;color:#666;line-height:1.6;">
      Seu perfil não está mais visível na plataforma. Entre em contato com o suporte para contestar esta decisão.
    </p>
    ${btn(panelUrl, "Acessar painel")}
    <p style="margin:0;font-size:12px;color:#bbb;">Privello · contato.privello@gmail.com</p>
  `);
}

/**
 * Template do e-mail "Sua conta no Privello foi reativada". Disparado quando
 * a moderação reativa um perfil previamente suspenso.
 *
 * Variáveis interpoladas:
 * - `name` — `Profile.displayName` do provider reativado.
 * - `panelUrl` — URL absoluta para o painel do provider.
 *
 * Consumido por: `src/app/_actions/admin-moderation.ts > unsuspendProfile`.
 *
 * @param name - Nome de exibição do provider.
 * @param panelUrl - URL para o painel do provider.
 * @returns HTML completo do e-mail.
 */
export function unsuspensionTemplate(name: string, panelUrl: string) {
  return base(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:normal;">Conta reativada</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#666;line-height:1.6;">
      Olá, <strong>${name}</strong>! Sua conta no Privello foi <strong>reativada</strong>. Seu perfil está novamente visível na plataforma.
    </p>
    ${btn(panelUrl, "Acessar painel")}
    <p style="margin:0;font-size:12px;color:#bbb;">Bem-vindo de volta.</p>
  `);
}
