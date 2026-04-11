/**
 * Maps API/JSON experience records to the shape the UI expects.
 * Adds derived condition labels from conditionScore when missing.
 */
export function normalizeExperience(raw) {
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
  return {
    ...raw,
    condition: raw.condition ?? condition,
    conditionType: raw.conditionType ?? conditionType,
  };
}

export function normalizeExperiences(list) {
  return list.map(normalizeExperience);
}
