import { CATEGORIES } from "./appConstants.js";
import { parseTravelMinutes } from "./discoverDeck.js";

function categoryLabel(id) {
  return CATEGORIES.find((category) => category.id === id)?.label ?? id;
}

function joinNatural(parts) {
  if (parts.length <= 1) return parts[0] || "";
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts.at(-1)}`;
}

function describeDistance(distance) {
  const minutes = parseTravelMinutes(distance);
  if (minutes <= 60) return "easy to act on today";
  if (minutes <= 180) return "worth a half-day window";
  return "better as a bigger-planning move";
}

function pickPhrase(seed, phrases) {
  if (!phrases.length) return "";
  let total = 0;
  const value = String(seed || "drift");
  for (let index = 0; index < value.length; index += 1) {
    total += value.charCodeAt(index);
  }
  return phrases[total % phrases.length];
}

export function getWhyForYou(experience, prefs) {
  const reasons = [];
  const categoryTone = pickPhrase(experience.id, {
    hiking: ["it fits a scenic walking day", "it lands like a strong trail pick", "it keeps the outing grounded and outdoorsy"],
    water: ["it scratches the water-day itch", "it turns the day toward paddling and shoreline payoff", "it plays well for a lake-and-river mood"],
    climbing: ["it brings a higher-adrenaline option into the mix", "it adds a more technical challenge", "it gives the deck some real edge"],
    biking: ["it makes sense for a low-friction ride", "it fits a movement-first day", "it gives you a strong spin-or-cruise option"],
    camping: ["it opens up a fuller overnight move", "it works if you want more time outside", "it pushes the day toward a camp-style plan"],
    fishing: ["it leans into a slower, patient outing", "it works for a cast-and-unwind plan", "it makes sense for a water-and-fishing mood"],
    stargazing: ["it is a real after-dark option", "it fits a slower evening outing", "it makes the night-sky angle concrete"],
    wildlife: ["it fits a quiet lookout day", "it rewards a slower observational pace", "it lines up with a wildlife-first mood"],
    foraging: ["it gives the day a more exploratory feel", "it fits a curious, hands-on outing", "it works for a browse-and-discover mood"],
  }[experience.category] || ["it fits what you have been leaning toward"]);

  if (experience.location === prefs.location) {
    reasons.push(`it is right in ${prefs.location}`);
  } else if (experience.location?.split(", ").at(-1) === prefs.location?.split(", ").at(-1)) {
    reasons.push(`it stays inside your ${prefs.location?.split(", ").at(-1)} search region`);
  }

  if (prefs.vibes?.length && prefs.vibes.includes(experience.category)) {
    reasons.push(`it matches your ${categoryLabel(experience.category).toLowerCase()} preference`);
  }

  if (prefs.kidFriendly && experience.kidFriendly) {
    reasons.push("it works for a kid-friendly outing");
  }

  if (prefs.comfort === "Casual" && experience.difficulty === "Easy") {
    reasons.push("the effort level stays easy");
  } else if (prefs.comfort === "Moderate" && ["Easy", "Moderate"].includes(experience.difficulty)) {
    reasons.push(`the ${experience.difficulty.toLowerCase()} difficulty fits your comfort range`);
  }

  reasons.push(categoryTone);
  reasons.push(`${experience.distance} makes it ${describeDistance(experience.distance)}`);

  return reasons.slice(0, 3);
}

export function getWhyNow(experience) {
  const reasons = [];
  const pacingLine = pickPhrase(experience.id, [
    "it has a strong spontaneous-move feel",
    "it works especially well as a same-day decision",
    "it looks like a clean weather-window play",
    "it feels like a low-regret thing to do next",
  ]);

  if (experience.conditionType === "perfect") {
    reasons.push("conditions are lining up unusually well right now");
  } else if (experience.conditionType === "great") {
    reasons.push("today has a clean weather window for it");
  } else {
    reasons.push("it still works well if you want a flexible backup option");
  }

  if (experience.cost === "Free") {
    reasons.push("it is low-friction to do spontaneously");
  }

  if (experience.time === "1–2 hrs" || experience.time === "Half day") {
    reasons.push("it fits neatly into a short planning window");
  }

  reasons.push(pacingLine);

  if (experience.season) {
    reasons.push(`${experience.season.toLowerCase()} timing keeps it in a strong season`);
  }

  return reasons.slice(0, 3);
}

export function getDeckNarrative(experiences, prefs) {
  if (!experiences.length) {
    return "The deck is widening beyond your strict filters so discovery never stalls out.";
  }

  const top = experiences.slice(0, 4);
  const categoryCounts = new Map();
  let easyCount = 0;

  top.forEach((experience) => {
    categoryCounts.set(experience.category, (categoryCounts.get(experience.category) || 0) + 1);
    if (experience.difficulty === "Easy") easyCount += 1;
  });

  const leadCategory = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const categoryText = leadCategory ? categoryLabel(leadCategory).toLowerCase() : "scenic";
  const effortText = easyCount >= 2 ? "lower-friction" : "mixed-effort";
  const distanceText = prefs.distance === "1 hr" || prefs.distance === "30 min" ? "quick-decision" : "broader-range";

  return `${categoryText} ideas are leading right now, with a ${effortText} and ${distanceText} mix at the top of the deck.`;
}

export function getCollectionSummary(collection, items) {
  if (!collection) {
    return {
      eyebrow: "Planning Board",
      title: "Untitled board",
      blurb: "A place to keep strong candidates together.",
      mood: "Open-ended",
      season: "All season",
      pace: "Flexible",
      cover: null,
    };
  }

  const cover = items[0] ?? null;
  const categoryCounts = new Map();
  const seasonCounts = new Map();
  let shortWindowCount = 0;

  items.forEach((item) => {
    categoryCounts.set(item.categoryLabel, (categoryCounts.get(item.categoryLabel) || 0) + 1);
    seasonCounts.set(item.season, (seasonCounts.get(item.season) || 0) + 1);
    if (["1–2 hrs", "Half day"].includes(item.time)) shortWindowCount += 1;
  });

  const leadCategory = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "Mixed";
  const leadSeason = [...seasonCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "Year-round";
  const pace = shortWindowCount >= Math.ceil(Math.max(items.length, 1) / 2) ? "Easy day planning" : "Longer-window planning";

  let blurb = "Start curating a few saves and this board will begin to tell a stronger story.";
  if (items.length > 0) {
    blurb = `${items.length} saved pick${items.length === 1 ? "" : "s"} with a ${leadCategory.toLowerCase()} lean and ${pace.toLowerCase()} rhythm.`;
  }

  return {
    eyebrow: collection.id === "saved" ? "Core Library" : "Planning Board",
    title: `${collection.icon} ${collection.label}`,
    blurb,
    mood: leadCategory,
    season: leadSeason,
    pace,
    cover,
  };
}

export function formatInsightLine(parts) {
  return joinNatural(parts.filter(Boolean));
}
