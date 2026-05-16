import { z } from "zod";

export const OpenTicketSchema = z.object({
    subject: z.string().trim().min(1).max(120),
    text: z.string().trim().min(1).max(5000),
});
export type OpenTicket = z.infer<typeof OpenTicketSchema>;

export const ReplyTicketSchema = z.object({
    ticketId: z.string().cuid(),
    text: z.string().trim().min(1).max(5000),
});
export type ReplyTicket = z.infer<typeof ReplyTicketSchema>;

export const CloseTicketSchema = z.object({
    ticketId: z.string().cuid(),
});
export type CloseTicket = z.infer<typeof CloseTicketSchema>;

export const ReopenTicketSchema = z.object({
    ticketId: z.string().cuid(),
});
export type ReopenTicket = z.infer<typeof ReopenTicketSchema>;
