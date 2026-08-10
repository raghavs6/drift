export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export async function fetchExperiences() {
  const response = await fetch(`${API_BASE}/api/experiences`);
  if (!response.ok) {
    throw new Error(`Failed to fetch experiences: ${response.status}`);
  }

  const data = await response.json();
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function authHeaders(accessToken) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
}

async function requestJson(path, accessToken, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: authHeaders(accessToken),
  });
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${path} failed: ${response.status}`);
  }
  return response.json();
}

export function getPreferences(accessToken) {
  return requestJson("/api/preferences", accessToken);
}

export function putPreferences(accessToken, prefs) {
  return requestJson("/api/preferences", accessToken, {
    method: "PUT",
    body: JSON.stringify(prefs),
  });
}

export function getSwipes(accessToken) {
  return requestJson("/api/swipes", accessToken);
}

export function recordSwipe(accessToken, experienceId, action) {
  return requestJson("/api/swipes", accessToken, {
    method: "POST",
    body: JSON.stringify({ experience_id: experienceId, action }),
  });
}

export function getCollections(accessToken) {
  return requestJson("/api/collections", accessToken);
}

export function putCollections(accessToken, collections) {
  return requestJson("/api/collections", accessToken, {
    method: "PUT",
    body: JSON.stringify({ collections }),
  });
}

export async function planTrip(payload) {
  const response = await fetch(`${API_BASE}/api/plan-trip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Trip planner returned ${response.status}`);
  }
  return response.json();
}
