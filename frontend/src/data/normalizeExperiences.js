function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function formatLocation(raw) {
  const direct = firstDefined(raw.location, raw.Location);
  if (direct) return direct;

  const city = firstDefined(raw.city, raw.City, raw.FacilityCity);
  const state = firstDefined(raw.state, raw.State, raw.FacilityStateCode, raw.RecAreaStateCode);
  if (city && state) return `${city}, ${state}`;
  return city || state || "Unknown location";
}

function inferCategory(raw) {
  const source = [
    raw.category,
    raw.categoryLabel,
    raw.activity,
    raw.activityType,
    raw.ActivityName,
    raw.FacilityTypeDescription,
    raw.RecAreaName,
    raw.title,
    raw.name,
    raw.FacilityName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (source.includes("kayak") || source.includes("paddle") || source.includes("lake") || source.includes("water")) return "water";
  if (source.includes("bike") || source.includes("cycling")) return "biking";
  if (source.includes("camp")) return "camping";
  if (source.includes("fish")) return "fishing";
  if (source.includes("climb") || source.includes("scramble")) return "climbing";
  if (source.includes("star") || source.includes("night sky")) return "stargazing";
  if (source.includes("wildlife") || source.includes("bird")) return "wildlife";
  if (source.includes("forag")) return "foraging";
  return "hiking";
}

function labelForCategory(category) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function pickImages(raw, category) {
  if (Array.isArray(raw.images) && raw.images.length >= 3) return raw.images;
  if (Array.isArray(raw.MEDIA) && raw.MEDIA.length >= 3) {
    return raw.MEDIA.slice(0, 3).map((item) => item?.URL || item?.url).filter(Boolean);
  }

  const fallbackPalettes = {
    hiking: ["#5A8F6E", "#3D6B4E", "#8BB89A"],
    water: ["#3D6B8E", "#2D5A7E", "#5A8FAE"],
    climbing: ["#8B6B4E", "#6B4E3A", "#A88B6B"],
    biking: ["#3A5A78", "#2D4A66", "#5A7A9A"],
    camping: ["#4A6646", "#374F35", "#78906F"],
    fishing: ["#4C7A74", "#325A55", "#79A7A2"],
    stargazing: ["#1a2744", "#0d1b33", "#2a3d5c"],
    wildlife: ["#6B8F5E", "#4A6B3E", "#8BB87A"],
    foraging: ["#6B5A3E", "#4F432D", "#8C7A57"],
  };

  return fallbackPalettes[category] || fallbackPalettes.hiking;
}

/**
 * Maps API/JSON experience records to the shape the UI expects.
 * Adds derived condition labels from conditionScore when missing.
 */
export function normalizeExperience(raw) {
  const category = inferCategory(raw);
  const conditionScore = raw.conditionScore ?? 0;
  let condition;
  let conditionType;
  if (conditionScore > 0.85) {
    condition = "Perfect right now";
    conditionType = "perfect";
  } else if (conditionScore > 0.7) {
    condition = "Great this week";
    conditionType = "great";
  } else {
    condition = "Check conditions";
    conditionType = "check";
  }

  const title = firstDefined(raw.title, raw.name, raw.FacilityName, raw.RecAreaName, "Untitled experience");
  const location = formatLocation(raw);
  const description =
    firstDefined(raw.description, raw.Description, raw.FacilityDescription, raw.RecAreaDescription) ||
    "A promising outdoor experience from the current feed.";
  const hook =
    firstDefined(raw.hook, raw.shortDescription, raw.Snippet, raw.FacilityDescription) ||
    description.slice(0, 110);

  return {
    ...raw,
    id: firstDefined(raw.id, raw.legacyId, raw.FacilityID, raw.RecAreaID, title.toLowerCase().replace(/[^a-z0-9]+/g, "-")),
    title,
    hook,
    location,
    distance: firstDefined(raw.distance, raw.driveTime, raw.DistanceLabel, "1 hr"),
    difficulty: firstDefined(raw.difficulty, raw.difficultyLabel, raw.Difficulty, "Moderate"),
    cost: firstDefined(raw.cost, raw.priceLabel, raw.FeeDescription, "Free"),
    time: firstDefined(raw.time, raw.duration, raw.DurationLabel, "2–3 hrs"),
    season: firstDefined(raw.season, raw.bestSeason, raw.SeasonLabel, "Year-round"),
    category,
    categoryLabel: firstDefined(raw.categoryLabel, labelForCategory(category)),
    kidFriendly: Boolean(firstDefined(raw.kidFriendly, raw.familyFriendly, raw.FamilyFriendly, false)),
    minAge: firstDefined(raw.minAge, raw.MinAge, 0),
    description,
    description2:
      firstDefined(raw.description2, raw.secondaryDescription, raw.Notes) ||
      "Check current conditions, hours, and access details before you head out.",
    whatToBring:
      Array.isArray(raw.whatToBring) && raw.whatToBring.length
        ? raw.whatToBring
        : ["Water", "Layers", "Phone charger", "Trail snacks"],
    images: pickImages(raw, category),
    condition: raw.condition ?? condition,
    conditionType: raw.conditionType ?? conditionType,
    conditionScore,
  };
}

export function normalizeExperiences(list) {
  return list.map(normalizeExperience);
}
