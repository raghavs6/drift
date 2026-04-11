export async function fetchExperiences() {
  const response = await fetch("/api/experiences");
  if (!response.ok) {
    throw new Error(`Failed to fetch experiences: ${response.status}`);
  }

  const data = await response.json();
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}
