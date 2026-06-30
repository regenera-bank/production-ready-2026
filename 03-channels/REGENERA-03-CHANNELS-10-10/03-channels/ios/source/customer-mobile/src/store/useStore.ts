// Estado de sessão é único. Features consomem esta fachada; não criam stores paralelos.
export { useStore } from '../app/state/use-app-store';
export type { UserProfile, UserTier } from '../app/state/use-app-store';
