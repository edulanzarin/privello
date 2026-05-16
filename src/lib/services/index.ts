/**
 * Barrel export para a camada de serviços.
 *
 * Uso: import { isSubscriber, getProfileBySlug } from "@/lib/services";
 *
 * Nota: As funções originais em queries.ts continuam funcionando.
 * Esta camada é a nova referência para lógica de negócio.
 */
export { isSubscriber, getActiveSubscription } from "./subscription.service";
export {
    getProfileBySlug,
    getProfileBySlugForPainel,
    getProfileMediaPage,
    getUserReviewForProfile,
} from "./profile.service";
export type {
    GetProfileBySlugOptions,
    ProfileMediaItem,
    ProfileMediaPage,
} from "./profile.service";
export { getCityBySlug, getOrCreateCityBySlug, getAllCities, getCitiesWithReels } from "./city.service";
export { getMediaWithCounts, listMediaComments } from "./media.service";
