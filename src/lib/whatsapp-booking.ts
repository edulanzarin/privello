import { formatBrl } from "@/lib/money";

export type WhatsAppBookingPayload = {
  displayName: string;
  dateLabel: string;
  startTime: string;
  endTime: string;
  durationLabel: string;
  locationLabel: string;
  totalBrl: number;
  notes?: string;
};

export function buildWhatsAppBookingMessage(p: WhatsAppBookingPayload): string {
  const lines = [
    `Olá, ${p.displayName}! Vi seu perfil no Privello e gostaria de combinar:`,
    ``,
    `• Dia: ${p.dateLabel}`,
    `• Início: ${p.startTime}`,
    `• Término previsto: ${p.endTime}`,
    `• Duração: ${p.durationLabel}`,
    `• Local: ${p.locationLabel}`,
    `• Valor combinado: ${formatBrl(p.totalBrl)}`,
  ];
  if (p.notes?.trim()) {
    lines.push(``, `Obs.: ${p.notes.trim()}`);
  }
  lines.push(``, `Podemos confirmar?`);
  return lines.join("\n");
}

export function whatsappDigits(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const d = phone.replace(/\D/g, "");
  if (!d) return null;
  return d;
}

export function buildWhatsAppUrl(phoneDigits: string, message: string): string {
  const text = encodeURIComponent(message);
  return `https://wa.me/${phoneDigits}?text=${text}`;
}
