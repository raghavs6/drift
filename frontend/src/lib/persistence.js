const STORAGE_KEY = "drift_v1";

function getStorageKey(userId = "local-guest") {
  return `${STORAGE_KEY}:${userId}`;
}

/**
 * @returns {{
 *   onboardingComplete: boolean,
 *   prefs: Record<string, unknown>,
 *   savedIds: string[],
 *   skippedIds: string[],
 * } | null}
 */
export function loadPersistedState(userId = "local-guest") {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return null;
    return data;
  } catch {
    return null;
  }
}

export function savePersistedState(state, userId = "local-guest") {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(state));
  } catch {
    /* quota / private mode */
  }
}

export function clearPersistedState(userId = "local-guest") {
  try {
    localStorage.removeItem(getStorageKey(userId));
  } catch {
    /* ignore */
  }
}
