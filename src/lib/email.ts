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
