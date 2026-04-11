import { DEFAULT_LOCATION, getStateFromLocation } from "./appConstants.js";

/** Default prefs when none stored (matches onboarding defaults). */
export const DEFAULT_PREFS = {
  location: DEFAULT_LOCATION,
  distance: "30 min",
  age: "25–34",
  kidFriendly: false,
  childAge: null,
  vibes: [],
  comfort: "Moderate",
};

/** Merge stored prefs with defaults (safe for older stored shapes). */
export function mergePrefs(raw) {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_PREFS };
  return {
    ...DEFAULT_PREFS,
    ...raw,
    vibes: Array.isArray(raw.vibes) ? raw.vibes : [],
  };
}

/** Map onboarding max-travel chip → max minutes from “home base”. */
const MAX_TRAVEL_MINUTES = {
  "15 min": 15,
  "30 min": 30,
  "1 hr": 60,
  "2 hr": 120,
};

/**
 * Parse experience.distance (travel time string) to minutes for comparison.
 * Falls back to a large number if unknown so we don't accidentally hide items.
 */
export function parseTravelMinutes(label) {
  if (!label || typeof label !== "string") return 9999;
  const s = label.trim().toLowerCase();

  if (s.includes("half day")) return 300;

  const range = s.match(/(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)\s*hr/);
  if (range) return Math.round(parseFloat(range[2]) * 60);

  const hr = s.match(/(\d+(?:\.\d+)?)\s*hr/);
  if (hr) return Math.round(parseFloat(hr[1]) * 60);

  const min = s.match(/(\d+)\s*min/);
  if (min) return parseInt(min[1], 10);

  return 180;
}

function difficultyAllowed(difficulty, comfort) {
  const d = difficulty || "";
  if (comfort === "Casual") return d === "Easy";
  if (comfort === "Moderate") return d === "Easy" || d === "Moderate";
  return true;
}

function sameState(locationA, locationB) {
  return getStateFromLocation(locationA) !== "" && getStateFromLocation(locationA) === getStateFromLocation(locationB);
}

function scoreExperience(exp, prefs) {
  let score = exp.conditionScore * 20;
  if (prefs.vibes?.length) {
    if (prefs.vibes.includes(exp.category)) score += 100;
  } else {
    score += 15;
  }
  if (exp.location === prefs.location) score += 40;
  else if (sameState(exp.location, prefs.location)) score += 18;
  if (prefs.kidFriendly && exp.kidFriendly) score += 25;
  if (difficultyAllowed(exp.difficulty, prefs.comfort)) score += 10;
  return score;
}

/**
 * Filter + sort experiences for the swipe deck.
 * If strict filters remove everything, relaxes category + comfort so the deck is never empty
 * (unless the catalog is empty).
 *
 * @param {Array<object>} experiences normalized experiences
 * @param {typeof DEFAULT_PREFS} prefs
 * @param {string[]} removedIds skipped + saved (no longer shown in Discover)
 */
export function buildDiscoverDeck(experiences, prefs, removedIds) {
  const removed = new Set(removedIds);
  const pool = experiences.filter((e) => !removed.has(e.id));
  if (pool.length === 0) return [];

  const maxMin = MAX_TRAVEL_MINUTES[prefs.distance] ?? 120;
  const selectedLocation = prefs.location || DEFAULT_LOCATION;

  function applyFilters(relaxCategoryComfort, relaxLocation) {
    return pool.filter((e) => {
      if (!relaxLocation && !sameState(e.location, selectedLocation)) return false;
      if (parseTravelMinutes(e.distance) > maxMin) return false;
      if (prefs.kidFriendly && !e.kidFriendly) return false;
      if (!relaxCategoryComfort) {
        if (prefs.vibes?.length && !prefs.vibes.includes(e.category)) return false;
        if (!difficultyAllowed(e.difficulty, prefs.comfort)) return false;
      }
      return true;
    });
  }

  let filtered = applyFilters(false, false);
  if (filtered.length === 0) filtered = applyFilters(true, false);
  if (filtered.length === 0) filtered = applyFilters(false, true);
  if (filtered.length === 0) filtered = applyFilters(true, true);
  if (filtered.length === 0) filtered = [...pool];

  const sorted = [...filtered].sort((a, b) => {
    const sa = scoreExperience(a, prefs);
    const sb = scoreExperience(b, prefs);
    if (sb !== sa) return sb - sa;
    return a.id.localeCompare(b.id);
  });

  return sorted;
}
