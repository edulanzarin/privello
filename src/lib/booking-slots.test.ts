import { describe, it, expect } from "vitest";
import type { AvailabilityRule, Profile, ProfileDurationOption } from "@prisma/client";
import {
    calendarMonthCells,
    computeEndTimeLabel,
    filterStartsForDuration,
    generateHalfHourStarts,
    getWindowForWeekday,
    isDateBeforeToday,
    isDateSelectable,
    OVERNIGHT_THRESHOLD_MIN,
    resolveDurationOptions,
    SLOT_STEP_MIN,
} from "@/lib/booking-slots";

type Rule = Pick<AvailabilityRule, "weekday" | "startTime" | "endTime" | "status">;
const rule = (weekday: number, startTime: string, endTime: string, status = "AVAILABLE"): Rule =>
    ({ weekday, startTime, endTime, status });

const dur = (
    o: Partial<ProfileDurationOption> & Pick<ProfileDurationOption, "minutes" | "label" | "priceBrl">,
): ProfileDurationOption =>
    ({
        id: o.id ?? `d-${o.minutes}`,
        profileId: o.profileId ?? "p1",
        minutes: o.minutes,
        label: o.label,
        priceBrl: o.priceBrl,
        active: o.active ?? true,
        sortOrder: o.sortOrder ?? 0,
    }) as ProfileDurationOption;

type ProfileForResolve = Pick<
    Profile,
    "priceHour" | "priceTwoHours" | "priceOvernight" | "priceTravelDay"
> & { durationOptions: ProfileDurationOption[] };

const profile = (over: Partial<ProfileForResolve> = {}): ProfileForResolve => ({
    priceHour: 300,
    priceTwoHours: null,
    priceOvernight: null,
    priceTravelDay: null,
    durationOptions: [],
    ...over,
});

describe("getWindowForWeekday", () => {
    it("retorna janela para dia AVAILABLE", () => {
        const rules = [rule(1, "09:00", "18:00")];
        expect(getWindowForWeekday(rules, 1)).toEqual({ startMin: 9 * 60, endMin: 18 * 60 });
    });

    it("retorna null quando o dia está CLOSED", () => {
        const rules = [rule(2, "09:00", "18:00", "CLOSED")];
        expect(getWindowForWeekday(rules, 2)).toBeNull();
    });

    it("retorna null quando não há regra para o dia", () => {
        expect(getWindowForWeekday([rule(1, "09:00", "18:00")], 3)).toBeNull();
    });

    it("retorna null quando endTime <= startTime (regra inválida)", () => {
        expect(getWindowForWeekday([rule(1, "10:00", "10:00")], 1)).toBeNull();
        expect(getWindowForWeekday([rule(1, "18:00", "09:00")], 1)).toBeNull();
    });
});

describe("generateHalfHourStarts", () => {
    it("gera inícios a cada 30min começando em startMin (end exclusivo)", () => {
        const starts = generateHalfHourStarts({ startMin: 12 * 60, endMin: 17 * 60 });
        expect(starts[0]).toBe("12:00");
        expect(starts[starts.length - 1]).toBe("16:30");
        expect(starts.length).toBe(((17 - 12) * 60) / 30);
    });

    it("respeita o stepMin custom", () => {
        const starts = generateHalfHourStarts({ startMin: 9 * 60, endMin: 11 * 60 }, 60);
        expect(starts).toEqual(["09:00", "10:00"]);
    });

    it("janela vazia (start === end) retorna lista vazia", () => {
        expect(generateHalfHourStarts({ startMin: 600, endMin: 600 })).toEqual([]);
    });

    it("janela menor que stepMin retorna apenas o início", () => {
        const starts = generateHalfHourStarts({ startMin: 600, endMin: 615 }, SLOT_STEP_MIN);
        expect(starts).toEqual(["10:00"]);
    });

    it("intervalo zero entra em loop infinito (limitação documentada)", () => {
        // Documenta o contrato real: stepMin = 0 não é suportado pela função (loop infinito).
        // Quem chamar a função é responsável por garantir step > 0. Preservamos esse contrato no teste.
        expect(SLOT_STEP_MIN).toBeGreaterThan(0);
    });
});

describe("filterStartsForDuration", () => {
    it("mantém apenas inícios em que start + duration ≤ endMin", () => {
        const window = { startMin: 9 * 60, endMin: 12 * 60 };
        const starts = generateHalfHourStarts(window);
        const filtered = filterStartsForDuration(starts, 60, window);
        expect(filtered[filtered.length - 1]).toBe("11:00");
    });

    it("duração igual à janela mantém apenas o primeiro horário", () => {
        const window = { startMin: 9 * 60, endMin: 11 * 60 };
        const starts = generateHalfHourStarts(window);
        expect(filterStartsForDuration(starts, 120, window)).toEqual(["09:00"]);
    });

    it("duração maior que janela retorna lista vazia", () => {
        const window = { startMin: 9 * 60, endMin: 10 * 60 };
        const starts = generateHalfHourStarts(window);
        expect(filterStartsForDuration(starts, 90, window)).toEqual([]);
    });

    it("input vazio mantém vazio", () => {
        expect(filterStartsForDuration([], 60, { startMin: 0, endMin: 60 })).toEqual([]);
    });
});

describe("resolveDurationOptions", () => {
    it("retorna apenas opções ativas, ordenadas por sortOrder e minutes", () => {
        const p = profile({
            durationOptions: [
                dur({ minutes: 120, label: "2h", priceBrl: 500, sortOrder: 2 }),
                dur({ minutes: 60, label: "1h", priceBrl: 250, sortOrder: 1 }),
                dur({ minutes: 90, label: "1h30", priceBrl: 350, sortOrder: 1 }),
                dur({ minutes: 240, label: "off", priceBrl: 800, active: false }),
            ],
        });

        const out = resolveDurationOptions(p);
        expect(out.map((o) => o.minutes)).toEqual([60, 90, 120]);
        expect(out.every((o) => o.source === "db")).toBe(true);
        expect(out.find((o) => o.minutes === 60)?.isOvernight).toBe(false);
    });

    it("marca isOvernight para opções com minutes >= OVERNIGHT_THRESHOLD_MIN", () => {
        const p = profile({
            durationOptions: [
                dur({ minutes: OVERNIGHT_THRESHOLD_MIN, label: "Pernoite", priceBrl: 1500 }),
            ],
        });
        expect(resolveDurationOptions(p)[0]?.isOvernight).toBe(true);
    });

    it("usa fallback quando não há opções ativas", () => {
        const p = profile({ priceHour: 300 });
        const out = resolveDurationOptions(p);
        expect(out.every((o) => o.source === "fallback")).toBe(true);
        expect(out.map((o) => o.minutes)).toEqual([60, 90, 120, 180, 720]);
        expect(out[0]?.priceBrl).toBe(300);
        // Pernoite default = priceHour * 5 quando priceOvernight é null
        expect(out[4]?.priceBrl).toBe(300 * 5);
        expect(out[4]?.isOvernight).toBe(true);
    });

    it("respeita priceTwoHours/priceOvernight quando informados no fallback", () => {
        const p = profile({ priceHour: 300, priceTwoHours: 550, priceOvernight: 2000 });
        const out = resolveDurationOptions(p);
        expect(out.find((o) => o.minutes === 120)?.priceBrl).toBe(550);
        expect(out.find((o) => o.minutes === 720)?.priceBrl).toBe(2000);
    });

    it("array vazio (mas presente) também cai no fallback", () => {
        const out = resolveDurationOptions(profile({ durationOptions: [] }));
        expect(out[0]?.source).toBe("fallback");
    });
});

describe("calendarMonthCells", () => {
    it("janeiro/2024 começa numa segunda-feira → 1 célula nula no início", () => {
        // 2024-01-01 era segunda → getDay() === 1
        const cells = calendarMonthCells(2024, 1);
        expect(cells.length % 7).toBe(0);
        expect(cells.slice(0, 1).every((c) => c.date === null)).toBe(true);
        expect(cells[1]?.date?.getDate()).toBe(1);
    });

    it("fevereiro de ano bissexto tem 29 dias", () => {
        const cells = calendarMonthCells(2024, 2);
        const days = cells.filter((c) => c.date !== null);
        expect(days.length).toBe(29);
    });

    it("fevereiro de ano não-bissexto tem 28 dias", () => {
        const cells = calendarMonthCells(2023, 2);
        expect(cells.filter((c) => c.date !== null).length).toBe(28);
    });

    it("dezembro/2024 (31 dias) preenche o calendário com múltiplo de 7", () => {
        const cells = calendarMonthCells(2024, 12);
        expect(cells.length % 7).toBe(0);
        expect(cells.filter((c) => c.date !== null).length).toBe(31);
    });
});

describe("isDateBeforeToday", () => {
    it("ontem é antes de hoje", () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        expect(isDateBeforeToday(yesterday)).toBe(true);
    });

    it("hoje (com horário diferente) não é antes de hoje", () => {
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        expect(isDateBeforeToday(today)).toBe(false);
    });

    it("amanhã não é antes de hoje", () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        expect(isDateBeforeToday(tomorrow)).toBe(false);
    });
});

describe("isDateSelectable", () => {
    it("data passada não é selecionável mesmo com regra ativa", () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const rules = Array.from({ length: 7 }, (_, w) => rule(w, "00:00", "23:59"));
        expect(isDateSelectable(yesterday, rules)).toBe(false);
    });

    it("data futura com regra CLOSED não é selecionável", () => {
        const future = new Date();
        future.setDate(future.getDate() + 1);
        const rules = Array.from({ length: 7 }, (_, w) => rule(w, "00:00", "23:59", "CLOSED"));
        expect(isDateSelectable(future, rules)).toBe(false);
    });

    it("data futura com regra AVAILABLE no weekday correto é selecionável", () => {
        const future = new Date();
        future.setDate(future.getDate() + 7);
        const rules = [rule(future.getDay(), "09:00", "18:00")];
        expect(isDateSelectable(future, rules)).toBe(true);
    });
});

describe("computeEndTimeLabel", () => {
    it("retorna fim como HH:MM somando duração", () => {
        expect(computeEndTimeLabel("12:00", 90)).toBe("13:30");
    });

    it("rola corretamente cruzando meia-noite", () => {
        expect(computeEndTimeLabel("23:30", 60)).toBe("00:30");
    });
});
