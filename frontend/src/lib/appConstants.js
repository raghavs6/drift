import rawExperiences from "../data/experiences.json";

export const CATEGORIES = [
  { id: "hiking", label: "Hiking", icon: "🥾" },
  { id: "water", label: "Water", icon: "🛶" },
  { id: "climbing", label: "Climbing", icon: "🧗" },
  { id: "biking", label: "Biking", icon: "🚵" },
  { id: "camping", label: "Camping", icon: "⛺" },
  { id: "fishing", label: "Fishing", icon: "🎣" },
  { id: "stargazing", label: "Stargazing", icon: "✨" },
  { id: "wildlife", label: "Wildlife", icon: "🦅" },
  { id: "foraging", label: "Foraging", icon: "🍄" },
];

export const DISTANCES = ["15 min", "30 min", "1 hr", "2 hr"];

export const AGES = ["18–24", "25–34", "35–44", "45–54", "55+"];

export const COMFORT = [
  { label: "Casual", desc: "Flat terrain, easy access, family pace" },
  { label: "Moderate", desc: "Some elevation, moderate effort" },
  { label: "Adventurous", desc: "Challenging terrain, higher effort" },
];

export const DEFAULT_LOCATION = "Madison, WI";

export function getStateFromLocation(locationLabel = "") {
  return locationLabel.split(",").map((part) => part.trim()).filter(Boolean).at(-1) || "";
}

export const LOCATION_OPTIONS = [...new Set(rawExperiences.map((experience) => experience.location))]
  .sort((a, b) => {
    const stateCompare = getStateFromLocation(a).localeCompare(getStateFromLocation(b));
    if (stateCompare !== 0) return stateCompare;
    return a.localeCompare(b);
  });
