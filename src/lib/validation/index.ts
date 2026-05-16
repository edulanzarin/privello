/**
 * Re-exports nomeados de todos os schemas Zod desta fase.
 *
 * Tarefa 4.2 do spec `fase-1-seguranca`. Os consumidores (Server Actions e
 * Route Handlers) vão fazer `import { XSchema } from "@/lib/validation"` na
 * Tarefa 4.4.
 */

// Helpers genéricos
export * from "./_form-utils";

// Server Actions — `src/app/_actions/**`
export * from "./auth.schema";
export * from "./client-profile.schema";
export * from "./favorites.schema";
export * from "./onboarding.schema";
export * from "./reels.schema";
export * from "./stories.schema";
export * from "./support.schema";
export * from "./track-view.schema";
export * from "./verification.schema";
export * from "./admin-moderation.schema";

// Server Actions — `src/app/painel/_actions/**`
export * from "./provider-settings.schema";

// Route Handlers — `src/app/api/**`
export * from "./cadastro.schema";
export * from "./cities.schema";
export * from "./media.schema";
export * from "./mp.schema";
export * from "./profiles.schema";
export * from "./reels-api.schema";
export * from "./review.schema";
export * from "./stories-api.schema";
export * from "./upload.schema";
export * from "./wa-click.schema";
