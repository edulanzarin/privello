-- Remove feature: MeetingRequest (solicitações de encontro)
-- Booking flow now goes directly to WhatsApp without DB persistence.

DROP TABLE IF EXISTS "MeetingRequest";
DROP TYPE IF EXISTS "MeetingRequestStatus";
