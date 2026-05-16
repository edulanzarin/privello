import { z } from "zod";

const DOCUMENT_TYPE = z.enum(["RG", "CNH", "PASSAPORTE"]).default("RG");
const PLAN_TIER = z.enum(["ESSENCIAL", "DESTAQUE", "PREMIUM"]);

export const SubmitVerificationCaseSchema = z.object({
    documentFrontUrl: z.string().url().min(1),
    documentBackUrl: z.string().url().min(1),
    selfieUrl: z.string().url().min(1),
    videoUrl: z.string().url().nullable().optional(),
    documentType: DOCUMENT_TYPE,
});
export type SubmitVerificationCase = z.infer<typeof SubmitVerificationCaseSchema>;

export const ApproveVerificationSchema = z.object({
    caseId: z.string().cuid(),
});
export type ApproveVerification = z.infer<typeof ApproveVerificationSchema>;

export const RejectVerificationSchema = z.object({
    caseId: z.string().cuid(),
    note: z.string().trim().max(1000).nullable().optional(),
});
export type RejectVerification = z.infer<typeof RejectVerificationSchema>;

export const AdminToggleVerificationSchema = z.object({
    profileId: z.string().cuid(),
});
export type AdminToggleVerification = z.infer<typeof AdminToggleVerificationSchema>;

export const AdminSetPlanSchema = z.object({
    profileId: z.string().cuid(),
    plan: PLAN_TIER,
});
export type AdminSetPlan = z.infer<typeof AdminSetPlanSchema>;
