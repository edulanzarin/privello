import { describe, it, expect } from "vitest";
import {
    addMinutesToTime,
    formatYearMonth,
    isSameLocalDay,
    minutesToTime,
    parseMonthParam,
    startOfTodayLocal,
    timeToMinutes,
    weekdayFromDate,
} from "@/lib/time-utils";

describe("timeToMinutes", () => {
    it("converte 'HH:MM' para minutos desde meia-noite", () => {
        expect(timeToMinutes("00:00")).toBe(0);
        expect(timeToMinutes("09:30")).toBe(9 * 60 + 30);
        expect(timeToMinutes("23:59")).toBe(23 * 60 + 59);
    });

    it("aceita hora com 1 dígito ('9:05')", () => {
        expect(timeToMinutes("9:05")).toBe(9 * 60 + 5);
    });

    it("trim de espaços é aplicado", () => {
        expect(timeToMinutes("  10:15  ")).toBe(10 * 60 + 15);
    });

    it("retorna 0 para input inválido", () => {
        expect(timeToMinutes("xx:yy")).toBe(0);
        expect(timeToMinutes("")).toBe(0);
        expect(timeToMinutes("9-30")).toBe(0);
    });

    it("clampa em 1439 quando hora extrapola", () => {
        expect(timeToMinutes("99:00")).toBe(1439);
    });
});

describe("minutesToTime", () => {
    it("formata minutos como HH:MM com padding", () => {
        expect(minutesToTime(0)).toBe("00:00");
        expect(minutesToTime(5)).toBe("00:05");
        expect(minutesToTime(60)).toBe("01:00");
        expect(minutesToTime(1439)).toBe("23:59");
    });

    it("encapsula em 24h (1440 → 00:00)", () => {
        expect(minutesToTime(1440)).toBe("00:00");
        expect(minutesToTime(1500)).toBe("01:00");
    });

    it("aceita valores negativos (rolagem)", () => {
        expect(minutesToTime(-1)).toBe("23:59");
        expect(minutesToTime(-60)).toBe("23:00");
    });
});

describe("addMinutesToTime", () => {
    it("soma minutos preservando o formato 'HH:MM'", () => {
        expect(addMinutesToTime("09:00", 30)).toBe("09:30");
        expect(addMinutesToTime("23:30", 60)).toBe("00:30");
        expect(addMinutesToTime("00:00", 1440)).toBe("00:00");
    });

    it("borda meia-noite", () => {
        expect(addMinutesToTime("23:59", 1)).toBe("00:00");
    });

    it("input inválido começa em 0 e ainda soma", () => {
        expect(addMinutesToTime("nope", 75)).toBe("01:15");
    });
});

describe("weekdayFromDate", () => {
    it("retorna 0 para domingo e 6 para sábado (horário local)", () => {
        // 2024-01-07 = domingo, 2024-01-13 = sábado
        expect(weekdayFromDate(new Date(2024, 0, 7))).toBe(0);
        expect(weekdayFromDate(new Date(2024, 0, 13))).toBe(6);
    });
});

describe("startOfTodayLocal", () => {
    it("retorna meia-noite local com h=m=s=ms=0", () => {
        const t = startOfTodayLocal();
        expect(t.getHours()).toBe(0);
        expect(t.getMinutes()).toBe(0);
        expect(t.getSeconds()).toBe(0);
        expect(t.getMilliseconds()).toBe(0);
    });
});

describe("isSameLocalDay", () => {
    it("considera mesmo dia mesmo com horários diferentes", () => {
        expect(
            isSameLocalDay(new Date(2024, 5, 15, 0, 0, 0), new Date(2024, 5, 15, 23, 59, 59)),
        ).toBe(true);
    });

    it("dias adjacentes são diferentes (incluindo borda meia-noite)", () => {
        expect(
            isSameLocalDay(new Date(2024, 5, 15, 23, 59, 59), new Date(2024, 5, 16, 0, 0, 0)),
        ).toBe(false);
    });

    it("borda fim de mês: último dia do mês ≠ primeiro do mês seguinte", () => {
        expect(
            isSameLocalDay(new Date(2024, 0, 31, 23, 0), new Date(2024, 1, 1, 0, 30)),
        ).toBe(false);
    });

    it("anos diferentes → falso", () => {
        expect(isSameLocalDay(new Date(2023, 11, 31), new Date(2024, 0, 1))).toBe(false);
    });
});

describe("parseMonthParam", () => {
    it("aceita formato 'YYYY-MM' válido", () => {
        expect(parseMonthParam("2024-07")).toEqual({ year: 2024, month: 7 });
        expect(parseMonthParam("1999-12")).toEqual({ year: 1999, month: 12 });
    });

    it("undefined → mês corrente", () => {
        const n = new Date();
        expect(parseMonthParam(undefined)).toEqual({ year: n.getFullYear(), month: n.getMonth() + 1 });
    });

    it("formato inválido → mês corrente", () => {
        const n = new Date();
        const fallback = { year: n.getFullYear(), month: n.getMonth() + 1 };
        expect(parseMonthParam("2024-7")).toEqual(fallback);
        expect(parseMonthParam("2024/07")).toEqual(fallback);
        expect(parseMonthParam("not-a-date")).toEqual(fallback);
    });

    it("mês fora de [1,12] → mês corrente", () => {
        const n = new Date();
        const fallback = { year: n.getFullYear(), month: n.getMonth() + 1 };
        expect(parseMonthParam("2024-00")).toEqual(fallback);
        expect(parseMonthParam("2024-13")).toEqual(fallback);
    });
});

describe("formatYearMonth", () => {
    it("formata com pad em mês de 1 dígito", () => {
        expect(formatYearMonth(2024, 1)).toBe("2024-01");
        expect(formatYearMonth(2024, 9)).toBe("2024-09");
    });

    it("não pad em mês de 2 dígitos", () => {
        expect(formatYearMonth(2024, 12)).toBe("2024-12");
    });

    it("é inverso de parseMonthParam para entradas válidas", () => {
        for (const ym of ["2024-01", "2024-07", "1999-12"]) {
            const { year, month } = parseMonthParam(ym);
            expect(formatYearMonth(year, month)).toBe(ym);
        }
    });
});
