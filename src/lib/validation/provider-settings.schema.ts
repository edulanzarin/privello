import { z } from "zod";

const PLAN_TIER = z.enum(["ESSENCIAL", "DESTAQUE", "PREMIUM"]);
const TIME_HHMM = /^\d{2}:\d{2}$/;
const HANDLE_REGEX = /^[a-z0-9_-]{3,30}$/;

/** Janela semanal de disponibilidade (1 entrada por weekday 0–6). */
const AvailabilityWindowSchema = z
    .object({
        weekday: z.number().int().min(0).max(6),
        open: z.boolean(),
        startTime: z.string().regex(TIME_HHMM),
        endTime: z.string().regex(TIME_HHMM),
    })
    .refine((w) => !w.open || w.endTime > w.startTime, {
        message: "endTime deve ser maior que startTime quando open=true",
        path: ["endTime"],
    });

export const SaveAvailabilityWindowsSchema = z.object({
    windows: z.array(AvailabilityWindowSchema).length(7),
});
export type SaveAvailabilityWindows = z.infer<typeof SaveAvailabilityWindowsSchema>;

/** Linha de `saveDurationOptions`. */
const DurationOptionRowSchema = z.object({
    minutes: z.number().int().min(15).max(2880),
    label: z.string().trim().max(120).optional(),
    priceBrl: z.number().int().nonnegative(),
});

export const SaveDurationOptionsSchema = z.object({
    durations: z.array(DurationOptionRowSchema).min(1),
    paymentMethods: z.string().trim().max(500).optional(),
});
export type SaveDurationOptions = z.infer<typeof SaveDurationOptionsSchema>;

const FinancialBaseSchema = z.object({
    clientLabel: z.string().trim().min(1).max(120),
    durationLabel: z.string().trim().max(120),
    locationLabel: z.string().trim().max(120),
    paymentLabel: z.string().trim().max(120),
    amountBrl: z.coerce.number().int().positive(),
    isNoShow: z.coerce.boolean().default(false),
});

export const UpdateFinancialRecordSchema = FinancialBaseSchema.extend({
    recordId: z.string().cuid(),
});
export type UpdateFinancialRecord = z.infer<typeof UpdateFinancialRecordSchema>;

export const DeleteFinancialRecordSchema = z.object({
    recordId: z.string().cuid(),
});
export type DeleteFinancialRecord = z.infer<typeof DeleteFinancialRecordSchema>;

export const AddFinancialRecordSchema = FinancialBaseSchema.extend({
    notes: z.string().trim().max(2000).nullable().optional(),
});
export type AddFinancialRecord = z.infer<typeof AddFinancialRecordSchema>;

export const ChangeHandleSchema = z.object({
    handle: z.string().trim().toLowerCase().regex(HANDLE_REGEX),
});
export type ChangeHandle = z.infer<typeof ChangeHandleSchema>;

export const DevActivatePlanSchema = z.object({
    tier: PLAN_TIER,
});
export type DevActivatePlan = z.infer<typeof DevActivatePlanSchema>;
