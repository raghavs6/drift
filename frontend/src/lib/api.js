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
