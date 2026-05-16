import { describe, it, expect } from "vitest";
import {
    buildWhatsAppBookingMessage,
    buildWhatsAppUrl,
    whatsappDigits,
    type WhatsAppBookingPayload,
} from "@/lib/whatsapp-booking";

const basePayload: WhatsAppBookingPayload = {
    displayName: "Helena",
    dateLabel: "sexta, 15 de março",
    startTime: "14:00",
    endTime: "15:00",
    durationLabel: "1 hora",
    locationLabel: "Local da acompanhante",
    totalBrl: 300,
};

describe("buildWhatsAppBookingMessage", () => {
    it("monta mensagem padrão (não-pernoite) com início, término e valor formatado", () => {
        const msg = buildWhatsAppBookingMessage(basePayload);

        expect(msg).toContain("Olá, Helena!");
        expect(msg).toContain("• Dia: sexta, 15 de março");
        expect(msg).toContain("• Início: 14:00");
        expect(msg).toContain("• Término previsto: 15:00");
        expect(msg).toContain("• Duração: 1 hora");
        expect(msg).toContain("• Local: Local da acompanhante");
        // formatBrl usa NBSP entre R$ e o valor.
        expect(msg).toMatch(/• Valor combinado: R\$\u00a0300/);
        expect(msg.endsWith("Podemos confirmar?")).toBe(true);
    });

    it("modo pernoite substitui início/término/duração por modalidade única", () => {
        const msg = buildWhatsAppBookingMessage({
            ...basePayload,
            isOvernight: true,
            durationLabel: "Pernoite",
        });

        expect(msg).toContain("• Modalidade: Pernoite (horário a combinar)");
        expect(msg).not.toContain("• Início:");
        expect(msg).not.toContain("• Término previsto:");
        expect(msg).not.toContain("• Duração:");
    });

    it("inclui obs apenas quando há texto não vazio (após trim)", () => {
        const withNotes = buildWhatsAppBookingMessage({
            ...basePayload,
            notes: "  trazer documento  ",
        });
        expect(withNotes).toContain("Obs.: trazer documento");

        const blankNotes = buildWhatsAppBookingMessage({ ...basePayload, notes: "   " });
        expect(blankNotes).not.toContain("Obs.:");

        const emptyNotes = buildWhatsAppBookingMessage({ ...basePayload, notes: "" });
        expect(emptyNotes).not.toContain("Obs.:");
    });

    it("payload mínimo (sem notes, totalBrl=0) ainda gera mensagem coerente", () => {
        const msg = buildWhatsAppBookingMessage({ ...basePayload, totalBrl: 0 });
        expect(msg).toContain("R$\u00a00");
        expect(msg).not.toContain("Obs.:");
    });
});

describe("whatsappDigits", () => {
    it("remove tudo que não é dígito", () => {
        expect(whatsappDigits("+55 (47) 99999-1234")).toBe("5547999991234");
    });

    it("retorna null para null/undefined", () => {
        expect(whatsappDigits(null)).toBeNull();
        expect(whatsappDigits(undefined)).toBeNull();
    });

    it("retorna null para string vazia ou somente símbolos", () => {
        expect(whatsappDigits("")).toBeNull();
        expect(whatsappDigits("()-+ ")).toBeNull();
    });

    it("preserva sequência de dígitos quando já está limpa", () => {
        expect(whatsappDigits("5547999991234")).toBe("5547999991234");
    });
});

describe("buildWhatsAppUrl", () => {
    it("monta URL https://wa.me com texto encodado", () => {
        const url = buildWhatsAppUrl("5547999991234", "Olá, mundo!");
        expect(url).toBe("https://wa.me/5547999991234?text=Ol%C3%A1%2C%20mundo!");
    });

    it("escapa caracteres reservados de URL: &, =, ?, #", () => {
        const url = buildWhatsAppUrl("5547999991234", "a&b=c?d#e");
        const text = new URL(url).searchParams.get("text");
        expect(text).toBe("a&b=c?d#e");
        // E garante que o texto bruto no URL veio percent-encoded:
        expect(url).toContain("%26");
        expect(url).toContain("%3D");
        expect(url).toContain("%3F");
        expect(url).toContain("%23");
    });

    it("escapa quebras de linha como %0A", () => {
        const url = buildWhatsAppUrl("5547999991234", "linha 1\nlinha 2");
        expect(url).toContain("linha%201%0Alinha%202");
    });

    it("payload mínimo (mensagem vazia) gera ?text= sem nada após", () => {
        const url = buildWhatsAppUrl("5547999991234", "");
        expect(url).toBe("https://wa.me/5547999991234?text=");
    });

    it("preserva caracteres BRL formatados (R$ + NBSP) no encode", () => {
        const url = buildWhatsAppUrl("5547999991234", "R$\u00a0300");
        // R$ + NBSP + 300 → R%24%C2%A0300
        expect(url).toContain("R%24%C2%A0300");
    });

    it("integra com buildWhatsAppBookingMessage produzindo URL parseável", () => {
        const msg = buildWhatsAppBookingMessage(basePayload);
        const url = buildWhatsAppUrl("5547999991234", msg);
        const parsed = new URL(url);
        expect(parsed.origin + parsed.pathname).toBe("https://wa.me/5547999991234");
        expect(parsed.searchParams.get("text")).toBe(msg);
    });
});
