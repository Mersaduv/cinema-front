import { tokenStorage } from "./token-storage";
import {
  createDefaultTrackerConfig,
  ProgressTracker,
} from "../features/player/services/ProgressTracker";

/** Migrate anonymous local progress to the authenticated account after login. */
export async function migrateAnonymousWatchProgress(userId: string): Promise<void> {
  const tracker = ProgressTracker.getInstance();
  tracker.init(
    createDefaultTrackerConfig({
      userId,
      isAuthenticated: true,
      getAuthToken: () => tokenStorage.getToken(),
    }),
  );

  await tracker.migrateAnonymousHistory(userId);
}
