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

function btn(href: string, label: string) {
  return `<div style="margin:28px 0;">
    <a href="${href}" style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;padding:14px 28px;font-family:sans-serif;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">${label}</a>
  </div>`;
}

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

export function emailVerificationTemplate(verifyUrl: string, name?: string | null) {
  return base(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:normal;">Confirme seu email</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#666;line-height:1.6;">
      Olá${name ? `, <strong>${name}</strong>` : ""}! Para ativar sua conta no Privello, confirme seu endereço de email clicando no botão abaixo.
    </p>
    ${btn(verifyUrl, "Confirmar email")}
    <p style="margin:0;font-size:12px;color:#bbb;">O link expira em 24 horas. Se você não criou uma conta, ignore este email.</p>
  `);
}

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
