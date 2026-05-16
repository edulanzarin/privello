/**
 * Barrel export para a camada de serviços.
 *
 * Uso: import { isSubscriber, getProfileBySlug } from "@/lib/services";
 *
 * Nota: As funções originais em queries.ts continuam funcionando durante a
 * janela de migração (cf. `metricas-baseline.md > §5 Decisões > queries.ts
 * final`). Esta camada é a nova referência para lógica de negócio.
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
export {
    listProfilesForCity,
    searchProfilesGlobal,
    getPremiumWeekProfiles,
    getHotProfiles,
    getBoostedProfiles,
    getSectionProfiles,
} from "./discover.service";
export type {
    DiscoverFilters,
    GenderFilter,
    ProfileCardPayload,
    ProfileSort,
} from "./discover.service";
export { getStoriesForProfile, listStoriesForCity } from "./story.service";
export type { StoryGroup } from "./story.service";
