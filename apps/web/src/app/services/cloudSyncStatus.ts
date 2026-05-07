export type CloudAuthStatus = 'disabled' | 'authenticated' | 'local-only';

export interface WorkoutSyncResult {
  ok: boolean;
  skipped?: boolean;
  message: string;
}

const AUTH_STATUS_KEY = 'fitech_cloud_sync_status';
const SYNC_STATUS_KEY = 'fitech_last_cloud_sync_status';

export const getCloudSyncStatus = (): CloudAuthStatus => {
  return (localStorage.getItem(AUTH_STATUS_KEY) as CloudAuthStatus | null) ?? 'local-only';
};

export const rememberCloudStatus = (status: CloudAuthStatus) => {
  localStorage.setItem(AUTH_STATUS_KEY, status);
};

export const rememberWorkoutSyncStatus = (result: WorkoutSyncResult) => {
  localStorage.setItem(
    SYNC_STATUS_KEY,
    JSON.stringify({
      ...result,
      syncedAt: new Date().toISOString(),
    }),
  );
};

export const getLastCloudSyncStatus = (): (WorkoutSyncResult & { syncedAt?: string }) | null => {
  try {
    return JSON.parse(localStorage.getItem(SYNC_STATUS_KEY) || 'null');
  } catch {
    return null;
  }
};
