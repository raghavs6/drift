import { useEffect, useMemo, useState } from "react";
import { C } from "../theme/palette.js";
import { Tag, ConditionBadge } from "./ui.jsx";
import { CardImage } from "./CardImage.jsx";
import { formatInsightLine, getCollectionSummary, getWhyForYou, getWhyNow } from "../lib/insights.js";
import { Drifty } from "./Drifty.jsx";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

function parseTravelMinutes(label = "") {
  const text = String(label).toLowerCase();
  const minMatch = text.match(/(\d+)\s*min/);
  if (minMatch) return parseInt(minMatch[1], 10);
  const hrMatch = text.match(/(\d+(?:\.\d+)?)\s*hr/);
  if (hrMatch) return Math.round(parseFloat(hrMatch[1]) * 60);
  if (text.includes("half day")) return 300;
  return 9999;
}

function getCollectionStats(items) {
  const categoryCounts = new Map();
  let kidCount = 0;
  let perfectCount = 0;
  let shortestDrive = null;

  items.forEach((item) => {
    categoryCounts.set(item.categoryLabel, (categoryCounts.get(item.categoryLabel) || 0) + 1);
    if (item.kidFriendly) kidCount += 1;
    if (item.conditionType === "perfect") perfectCount += 1;
    const drive = parseTravelMinutes(item.distance);
    if (shortestDrive === null || drive < shortestDrive) shortestDrive = drive;
  });

  const topCategory = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "Mixed";

  return {
    topCategory,
    kidCount,
    perfectCount,
    shortestDrive: shortestDrive === null || shortestDrive === 9999 ? "--" : `${shortestDrive} min`,
  };
}

function sortCollectionItems(items, sortMode) {
  const sorted = [...items];
  if (sortMode === "closest") {
    sorted.sort((a, b) => parseTravelMinutes(a.distance) - parseTravelMinutes(b.distance));
  } else if (sortMode === "easy") {
    const order = { Easy: 0, Moderate: 1, Hard: 2 };
    sorted.sort((a, b) => (order[a.difficulty] ?? 9) - (order[b.difficulty] ?? 9));
  } else if (sortMode === "weather") {
    sorted.sort((a, b) => (b.conditionScore ?? 0) - (a.conditionScore ?? 0));
  } else {
    sorted.sort((a, b) => (b.conditionScore ?? 0) - (a.conditionScore ?? 0));
  }
  return sorted;
}

function filterCollectionItems(items, filterMode) {
  if (filterMode === "kid") return items.filter((item) => item.kidFriendly);
  if (filterMode === "perfect") return items.filter((item) => item.conditionType === "perfect");
  return items;
}

function buildFallbackPlan(experience) {
  const bring = (experience.whatToBring || []).slice(0, 6).join(", ");
  const bestTime =
    experience.conditionType === "perfect"
      ? "Go early or near golden hour while conditions are especially favorable."
      : experience.conditionType === "great"
      ? "Aim for the easiest weather window today or this weekend."
      : "Treat this as a flexible backup option and check conditions before you go.";

  return [
    "1. Best time to go",
    bestTime,
    "",
    "2. What to bring",
    `Bring: ${bring || "Water, layers, snacks, and a charged phone."}`,
    "",
    "3. Getting there",
    `Plan around roughly ${experience.distance} of travel to ${experience.location}. Give yourself a little buffer for parking, walking in, and settling into the spot.`,
    "",
    "4. Itinerary",
    `Start with the main experience window for ${experience.time.toLowerCase()}.`,
    `Build around the core draw: ${experience.hook}`,
    "Leave margin for a slower finish, photos, and a flexible stop on the way back.",
    "",
    "5. Pro tips",
    `This is a ${experience.difficulty.toLowerCase()} effort outing, so pace the day around that.`,
    `If you're deciding between options, this one is strongest in ${experience.season.toLowerCase()}.`,
    "Keep the plan light and let the best part of the place carry the day.",
  ].join("\n");
}

function TripPlanModal({ experience, onClose }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setUsingFallback(false);

    fetch(`${API_BASE}/api/plan-trip`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: experience.title,
        category: experience.categoryLabel,
        distance: experience.distance,
        difficulty: experience.difficulty,
        cost: experience.cost,
        description: experience.subtitle || experience.description,
        location: experience.location,
        tags: experience.tags,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Trip planner returned ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setPlan(data.plan);
      })
      .catch((err) => {
        if (!cancelled) {
          setPlan(buildFallbackPlan(experience));
          setUsingFallback(true);
          setError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [experience]);

  const formatPlan = (text) => {
    return text.split("\n").map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <br key={i} />;
      if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
        return (
          <h4 key={i} style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 15, color: C.text, margin: "18px 0 6px" }}>
            {trimmed.replace(/\*\*/g, "")}
          </h4>
        );
      }
      if (/^\d+\.\s\*\*/.test(trimmed)) {
        const clean = trimmed.replace(/\*\*/g, "");
        return (
          <h4 key={i} style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 15, color: C.text, margin: "18px 0 6px" }}>
            {clean}
          </h4>
        );
      }
      if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
        return (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4, fontSize: 13, color: C.textMid, lineHeight: 1.6 }}>
            <span style={{ color: C.green, flexShrink: 0 }}>•</span>
            <span>{trimmed.slice(2).replace(/\*\*/g, "")}</span>
          </div>
        );
      }
      return <p key={i} style={{ margin: "4px 0", fontSize: 13, color: C.textMid, lineHeight: 1.6 }}>{trimmed.replace(/\*\*/g, "")}</p>;
    });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.parchment,
          borderRadius: 24,
          width: "100%",
          maxWidth: 520,
          maxHeight: "80vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
          animation: "slideUp 0.3s ease",
        }}
      >
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${C.borderLight}`, display: "flex", alignItems: "center", gap: 12 }}>
          <Drifty size={36} pose="clipboard" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: C.textSoft, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 2 }}>Trip Plan</div>
            <h3 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 17, color: C.text, margin: 0 }}>{experience.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              border: `1px solid ${C.borderLight}`,
              background: "#fff",
              cursor: "pointer",
              fontSize: 16,
              color: C.textSoft,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 28px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "48px 20px" }}>
              <Drifty size={64} pose="wave" style={{ margin: "0 auto 16px", animation: "driftyBounce 1.2s ease-in-out infinite" }} />
              <p style={{ fontSize: 14, color: C.textMid, fontFamily: "'DM Sans', sans-serif" }}>
                Planning your adventure...
              </p>
            </div>
          ) : (
            <div>
              {usingFallback ? (
                <div
                  style={{
                    marginBottom: 16,
                    padding: "12px 14px",
                    borderRadius: 14,
                    background: "rgba(245,240,230,0.84)",
                    border: `1px solid ${C.borderLight}`,
                  }}
                >
                  <div style={{ fontSize: 11, color: C.textSoft, textTransform: "uppercase", letterSpacing: 1.1, marginBottom: 4 }}>
                    Local backup plan
                  </div>
                  <div style={{ fontSize: 12, color: C.textMid, lineHeight: 1.6 }}>
                    Live trip-planner service was unavailable, so Drifty put together a local fallback plan instead.
                  </div>
                  <div style={{ marginTop: 6, fontSize: 11, color: C.textSoft }}>
                    You can still use this plan as a strong starting point for the outing.
                  </div>
                </div>
              ) : null}
              <div>{formatPlan(plan)}</div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes driftyBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}

function ComparisonMetric({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12, paddingBottom: 8, marginBottom: 8, borderBottom: `1px solid ${C.borderLight}` }}>
      <span style={{ color: C.textSoft }}>{label}</span>
      <span style={{ color: C.text, fontWeight: 600, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function CompareCard({ experience, onViewDetail, onRemove, prefs, highlight }) {
  const whyForYou = formatInsightLine(getWhyForYou(experience, prefs || {}));
  const whyNow = formatInsightLine(getWhyNow(experience));

  return (
    <div
      style={{
        borderRadius: 18,
        overflow: "hidden",
        background: "#fff",
        border: `1px solid ${C.borderLight}`,
        boxShadow: "0 10px 28px rgba(61,107,78,0.08)",
        position: "relative",
      }}
    >
      {highlight ? (
        <div
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            zIndex: 2,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px 8px 8px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.92)",
            border: `1px solid ${C.borderLight}`,
            boxShadow: "0 10px 20px rgba(61,107,78,0.1)",
          }}
        >
          <Drifty size={32} pose="sparkle" />
          <div>
            <div style={{ fontSize: 10, color: C.textSoft, textTransform: "uppercase", letterSpacing: 1.1 }}>
              Drifty Pick
            </div>
            <div style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>
              Best current tradeoff
            </div>
          </div>
        </div>
      ) : null}
      <div style={{ height: 160, overflow: "hidden" }}>
        <CardImage experience={experience} style={{ height: 160 }} />
      </div>
      <div style={{ padding: "16px 18px" }}>
        <div style={{ fontSize: 11, color: C.textSoft, marginBottom: 6 }}>
          {experience.categoryLabel} · {experience.location}
        </div>
        <h3 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 18, lineHeight: 1.2, color: C.text, margin: "0 0 10px" }}>
          {experience.title}
        </h3>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          <Tag bg={C.greenLight} color={C.green}>{experience.difficulty}</Tag>
          <Tag bg={C.tanLight} color={C.tan}>{experience.cost}</Tag>
          <ConditionBadge type={experience.conditionType} label={experience.condition} />
        </div>

        <div
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            background: "rgba(232,240,229,0.72)",
            border: `1px solid ${C.borderLight}`,
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 11, color: C.textSoft, textTransform: "uppercase", letterSpacing: 1.1, marginBottom: 6 }}>
            Why this fits
          </div>
          <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>
            {whyForYou}
          </div>
        </div>

        <ComparisonMetric label="Drive" value={experience.distance} />
        <ComparisonMetric label="Time" value={experience.time} />
        <ComparisonMetric label="Season" value={experience.season} />
        <ComparisonMetric label="Family fit" value={experience.kidFriendly ? "Kid-friendly" : "Better for older groups"} />

        <div
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            background: "rgba(245,240,230,0.84)",
            border: `1px solid ${C.borderLight}`,
            margin: "12px 0",
          }}
        >
          <div style={{ fontSize: 11, color: C.textSoft, textTransform: "uppercase", letterSpacing: 1.1, marginBottom: 6 }}>
            Why now
          </div>
          <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>
            {whyNow}
          </div>
        </div>

        <p style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.6, margin: "0 0 10px" }}>
          {experience.hook}
        </p>
        <p style={{ fontSize: 12, color: C.textMid, lineHeight: 1.65, margin: "0 0 14px" }}>
          {experience.description}
        </p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          {experience.whatToBring.slice(0, 3).map((item) => (
            <Tag key={item} bg="#EDE8DC" color="#6B6050">{item}</Tag>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => onViewDetail(experience)}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: "#fff",
              color: C.textMid,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
            }}
          >
            View details
          </button>
          <button
            type="button"
            onClick={() => onRemove(experience.id)}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "none",
              background: C.greenLight,
              color: C.green,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
            }}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function CollectionCard({ experience, onViewDetail, onRemove, removeLabel, comparing, onToggleCompare, compareSelected, compareDisabled, onPlanTrip }) {
  return (
    <div
      onClick={() => onViewDetail(experience)}
      style={{
        borderRadius: 16,
        overflow: "hidden",
        background: "#fff",
        border: `1px solid ${C.borderLight}`,
        cursor: "pointer",
        transition: "all 0.15s",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-2px)";
        event.currentTarget.style.boxShadow = "0 6px 20px rgba(61,107,78,0.12)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "none";
        event.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
      }}
    >
      <div style={{ height: 130, overflow: "hidden" }}>
        <CardImage experience={experience} style={{ height: 130 }} />
      </div>
      <div style={{ padding: "14px 16px" }}>
        {comparing ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleCompare(experience.id);
            }}
            disabled={compareDisabled}
            style={{
              marginBottom: 10,
              padding: "7px 10px",
              borderRadius: 999,
              border: `1px solid ${compareSelected ? C.green : C.border}`,
              background: compareSelected ? C.greenLight : "#fff",
              color: compareSelected ? C.green : C.textSoft,
              fontSize: 11,
              cursor: compareDisabled ? "default" : "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {compareSelected ? "Selected for compare" : "Add to compare"}
          </button>
        ) : null}
        <div style={{ fontSize: 11, color: C.textSoft, marginBottom: 4 }}>
          {experience.categoryLabel} · {experience.distance}
        </div>
        <h3
          style={{
            fontFamily: "'Libre Baskerville', serif",
            fontSize: 14,
            fontWeight: 700,
            color: C.text,
            margin: "0 0 8px",
            lineHeight: 1.3,
          }}
        >
          {experience.title}
        </h3>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          <Tag bg={C.greenLight} color={C.green}>{experience.difficulty}</Tag>
          <Tag bg={C.tanLight} color={C.tan}>{experience.cost}</Tag>
          <ConditionBadge type={experience.conditionType} label={experience.condition} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onPlanTrip(experience);
            }}
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              border: "none",
              background: C.green,
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            🗺️ Plan Trip
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRemove(experience.id);
            }}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: "#fff",
              color: C.textSoft,
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {removeLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CollectionsView({
  collections,
  experiences,
  prefs,
  onViewDetail,
  onCreateCollection,
  onAddToCollection,
  onRemoveFromCollection,
  onDeleteCollection,
  onResetSaved,
}) {
  const [activeCol, setActiveCol] = useState("saved");
  const [isCreating, setIsCreating] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [compareIds, setCompareIds] = useState([]);
  const [planningExp, setPlanningExp] = useState(null);
  const [sortMode, setSortMode] = useState("best");
  const [filterMode, setFilterMode] = useState("all");

  useEffect(() => {
    if (!collections.some((collection) => collection.id === activeCol)) {
      setActiveCol("saved");
    }
  }, [activeCol, collections]);

  const experiencesById = useMemo(
    () => new Map(experiences.map((experience) => [experience.id, experience])),
    [experiences],
  );

  const selectedCollection = collections.find((collection) => collection.id === activeCol) ?? collections[0];
  const selectedItems = (selectedCollection?.itemIds ?? [])
    .map((id) => experiencesById.get(id))
    .filter(Boolean);

  const savedCollection = collections.find((collection) => collection.id === "saved");
  const savedItems = (savedCollection?.itemIds ?? [])
    .map((id) => experiencesById.get(id))
    .filter(Boolean);

  const availableToAdd = selectedCollection
    ? savedItems.filter((experience) => !selectedCollection.itemIds.includes(experience.id))
    : [];
  const collectionSummary = useMemo(
    () => getCollectionSummary(selectedCollection, selectedItems),
    [selectedCollection, selectedItems],
  );
  const collectionStats = useMemo(() => getCollectionStats(selectedItems), [selectedItems]);
  const displayedItems = useMemo(
    () => sortCollectionItems(filterCollectionItems(selectedItems, filterMode), sortMode),
    [selectedItems, filterMode, sortMode],
  );
  const featuredItems = displayedItems.slice(0, 3);
  const compareItems = compareIds.map((id) => experiencesById.get(id)).filter(Boolean);
  const compareMode = compareIds.length > 0;
  const driftyComparePick = compareItems[0] ?? null;
  const driftyBoardNote = displayedItems.length
    ? `This board leans ${collectionStats.topCategory.toLowerCase()} right now. I’d start with the strongest-condition card, then compare against the closest backup.`
    : "Once you save a few picks, I’ll help you read the board and spot the strongest tradeoffs.";

  const handleCreateSubmit = () => {
    const trimmed = draftName.trim();
    if (!trimmed) return;
    onCreateCollection(trimmed);
    setActiveCol(`pending:${trimmed.toLowerCase()}`);
    setDraftName("");
    setIsCreating(false);
  };

  useEffect(() => {
    if (!activeCol.startsWith("pending:")) return;
    const match = collections.find(
      (collection) => collection.label.toLowerCase() === activeCol.replace("pending:", ""),
    );
    if (match) {
      setActiveCol(match.id);
    }
  }, [activeCol, collections]);

  useEffect(() => {
    setCompareIds((current) => current.filter((id) => selectedCollection?.itemIds.includes(id)));
  }, [selectedCollection]);

  useEffect(() => {
    if (!selectedItems.length) {
      setFilterMode("all");
      return;
    }
    if (filterMode === "kid" && !selectedItems.some((item) => item.kidFriendly)) {
      setFilterMode("all");
    }
    if (filterMode === "perfect" && !selectedItems.some((item) => item.conditionType === "perfect")) {
      setFilterMode("all");
    }
  }, [selectedItems, filterMode]);

  const toggleCompare = (experienceId) => {
    setCompareIds((current) => {
      if (current.includes(experienceId)) {
        return current.filter((id) => id !== experienceId);
      }
      if (current.length >= 3) {
        return current;
      }
      return [...current, experienceId];
    });
  };

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
      <div
        style={{
          width: 240,
          flexShrink: 0,
          borderRight: `1px solid ${C.borderLight}`,
          padding: "24px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: C.textSoft,
            textTransform: "uppercase",
            letterSpacing: 1.2,
            padding: "0 10px",
          }}
        >
          Collections
        </div>

        {collections.map((collection) => (
          <button
            key={collection.id}
            onClick={() => setActiveCol(collection.id)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              background: activeCol === collection.id ? C.greenLight : "transparent",
              color: activeCol === collection.id ? C.green : C.textMid,
              transition: "all 0.15s",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500 }}>
              {collection.icon} {collection.label}
            </span>
            <span
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 8,
                background: activeCol === collection.id ? C.green : C.borderLight,
                color: activeCol === collection.id ? "#fff" : C.textSoft,
              }}
            >
              {collection.itemIds.length}
            </span>
          </button>
        ))}

        {isCreating ? (
          <div
            style={{
              marginTop: 4,
              padding: 12,
              borderRadius: 14,
              background: "#fff",
              border: `1px solid ${C.borderLight}`,
            }}
          >
            <input
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder="Weekend escapes"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                marginBottom: 10,
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={handleCreateSubmit}
                style={{
                  flex: 1,
                  padding: "9px 12px",
                  borderRadius: 10,
                  border: "none",
                  background: C.green,
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setDraftName("");
                }}
                style={{
                  padding: "9px 12px",
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  background: "#fff",
                  color: C.textSoft,
                  cursor: "pointer",
                  fontSize: 12,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            style={{
              marginTop: 4,
              padding: "10px 12px",
              borderRadius: 10,
              cursor: "pointer",
              fontSize: 13,
              color: C.textSoft,
              background: "none",
              border: "none",
              textAlign: "left",
              fontFamily: "'DM Sans', sans-serif",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            + New collection
          </button>
        )}
      </div>

      <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 24, color: C.text, margin: "0 0 4px" }}>
              {selectedCollection?.icon} {selectedCollection?.label}
            </h2>
            <p style={{ fontSize: 13, color: C.textSoft }}>
              {selectedItems.length} experience{selectedItems.length !== 1 ? "s" : ""} in this collection
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {selectedItems.length >= 2 ? (
              <button
                type="button"
                onClick={() => setCompareIds((current) => (current.length ? [] : selectedItems.slice(0, 2).map((item) => item.id)))}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: `1px solid ${compareMode ? C.green : C.border}`,
                  background: compareMode ? C.greenLight : "#fff",
                  color: compareMode ? C.green : C.textSoft,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                }}
              >
                {compareMode ? "Close compare" : "Compare picks"}
              </button>
            ) : null}
            {selectedCollection?.id === "saved" ? (
              <button
                type="button"
                onClick={() => onResetSaved?.()}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  background: "#fff",
                  color: C.textSoft,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                }}
              >
                Reset Saved
              </button>
            ) : null}
            {!["saved", "bucket"].includes(selectedCollection?.id) ? (
              <button
                type="button"
                onClick={() => onDeleteCollection(selectedCollection.id)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  background: "#fff",
                  color: C.textSoft,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                }}
              >
                Delete collection
              </button>
            ) : null}
          </div>
        </div>

        {compareMode ? (
          <div
            style={{
              marginBottom: 24,
              padding: 20,
              borderRadius: 22,
              border: `1px solid ${C.borderLight}`,
              background: "linear-gradient(180deg, rgba(250,249,246,0.98), rgba(245,240,230,0.8))",
              boxShadow: "0 18px 44px rgba(61,107,78,0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: 20,
                    background: "linear-gradient(180deg, rgba(232,240,229,0.96), rgba(245,240,230,0.96))",
                    border: `1px solid ${C.borderLight}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Drifty size={58} pose="clipboard" />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.textSoft, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8 }}>
                    Compare Mode
                  </div>
                  <h3 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 24, color: C.text, margin: "0 0 6px" }}>
                    Side-by-side planning view
                  </h3>
                  <p style={{ margin: 0, fontSize: 13, color: C.textMid, lineHeight: 1.6 }}>
                    Drifty is scanning timing, effort, and payoff so the strongest tradeoff rises to the top.
                  </p>
                </div>
              </div>
              <div style={{ fontSize: 12, color: C.textSoft }}>
                Pick up to 3 saved options to compare the tradeoffs.
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: `repeat(${compareItems.length}, minmax(0, 1fr))`, gap: 16 }}>
              {compareItems.map((experience) => (
                <CompareCard
                  key={experience.id}
                  experience={experience}
                  onViewDetail={onViewDetail}
                  onRemove={(experienceId) => setCompareIds((current) => current.filter((id) => id !== experienceId))}
                  prefs={prefs}
                  highlight={driftyComparePick?.id === experience.id}
                />
              ))}
            </div>
          </div>
        ) : null}

        <div
          style={{
            marginBottom: 24,
            borderRadius: 24,
            overflow: "hidden",
            border: `1px solid ${C.borderLight}`,
            background: "#fff",
            boxShadow: "0 18px 44px rgba(61,107,78,0.08)",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1.05fr 0.9fr", minHeight: 290 }}>
            <div style={{ minHeight: 290 }}>
              {collectionSummary.cover ? (
                <CardImage experience={collectionSummary.cover} style={{ height: "100%" }} />
              ) : (
                <div
                  style={{
                    height: "100%",
                    background:
                      "linear-gradient(135deg, rgba(123,168,138,0.34), rgba(245,240,230,0.78)), radial-gradient(circle at top right, rgba(61,107,78,0.2), transparent 40%)",
                  }}
                />
              )}
            </div>
            <div
              style={{
                padding: "28px 28px 24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                background: "linear-gradient(180deg, rgba(250,249,246,0.98), rgba(245,240,230,0.74))",
                borderLeft: `1px solid ${C.borderLight}`,
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: C.textSoft, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>
                  {collectionSummary.eyebrow}
                </div>
                <h3 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 30, lineHeight: 1.12, color: C.text, margin: "0 0 12px" }}>
                  {collectionSummary.title}
                </h3>
                <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.75, margin: "0 0 18px" }}>
                  {collectionSummary.blurb}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                  {[
                    { label: "Lead vibe", value: collectionStats.topCategory },
                    { label: "Closest pick", value: collectionStats.shortestDrive },
                    { label: "Perfect now", value: `${collectionStats.perfectCount}` },
                    { label: "Kid-ready", value: `${collectionStats.kidCount}` },
                  ].map((stat) => (
                    <div key={stat.label} style={{ padding: "12px 14px", borderRadius: 16, background: "rgba(255,255,255,0.76)", border: `1px solid ${C.borderLight}` }}>
                      <div style={{ fontSize: 11, color: C.textSoft, textTransform: "uppercase", letterSpacing: 1.1, marginBottom: 6 }}>
                        {stat.label}
                      </div>
                      <div style={{ fontSize: 16, color: C.text, fontWeight: 700 }}>
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
                <Tag bg={C.greenLight} color={C.green}>{collectionSummary.mood}</Tag>
                <Tag bg={C.tanLight} color={C.tan}>{collectionSummary.season}</Tag>
                <Tag bg="#EDE8DC" color="#6B6050">{collectionSummary.pace}</Tag>
              </div>
            </div>

            <div
              style={{
                padding: "24px 22px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                background: "rgba(255,255,255,0.92)",
                borderLeft: `1px solid ${C.borderLight}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: 18,
                    background: "linear-gradient(180deg, rgba(232,240,229,0.96), rgba(245,240,230,0.96))",
                    border: `1px solid ${C.borderLight}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Drifty size={50} pose="clipboard" />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.textSoft, textTransform: "uppercase", letterSpacing: 1.1, marginBottom: 4 }}>
                    Drifty's Read
                  </div>
                  <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 18, color: C.text }}>
                    Planning board status
                  </div>
                </div>
              </div>

              <div style={{ padding: "14px 16px", borderRadius: 18, background: "rgba(245,240,230,0.78)", border: `1px solid ${C.borderLight}`, fontSize: 13, color: C.textMid, lineHeight: 1.7 }}>
                {driftyBoardNote}
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, color: C.textSoft, textTransform: "uppercase", letterSpacing: 1.1, marginBottom: 10 }}>
                  Board controls
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  {[
                    { id: "best", label: "Best match" },
                    { id: "closest", label: "Closest" },
                    { id: "easy", label: "Easy first" },
                    { id: "weather", label: "Weather first" },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSortMode(option.id)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 999,
                        border: `1px solid ${sortMode === option.id ? C.green : C.border}`,
                        background: sortMode === option.id ? C.greenLight : "#fff",
                        color: sortMode === option.id ? C.green : C.textSoft,
                        cursor: "pointer",
                        fontSize: 12,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    { id: "all", label: "All picks" },
                    { id: "kid", label: "Kid-friendly" },
                    { id: "perfect", label: "Perfect now" },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setFilterMode(option.id)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 999,
                        border: `1px solid ${filterMode === option.id ? C.green : C.border}`,
                        background: filterMode === option.id ? C.greenLight : "#fff",
                        color: filterMode === option.id ? C.green : C.textSoft,
                        cursor: "pointer",
                        fontSize: 12,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {selectedCollection?.id !== "saved" ? (
          <div
            style={{
              marginBottom: 24,
              padding: 18,
              borderRadius: 18,
              background: "#fff",
              border: `1px solid ${C.borderLight}`,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: C.textSoft, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>
              Add From Saved
            </div>
            {savedItems.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: C.textSoft }}>
                Save a few experiences first, then you can organize them into collections here.
              </p>
            ) : availableToAdd.length === 0 ? (
              <p style={{ margin: 0, fontSize: 13, color: C.textSoft }}>
                Everything from Saved is already in this collection.
              </p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {availableToAdd.map((experience) => (
                  <button
                    key={experience.id}
                    type="button"
                    onClick={() => onAddToCollection(selectedCollection.id, experience.id)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 999,
                      border: `1px solid ${C.border}`,
                      background: C.parchment,
                      color: C.textMid,
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 12,
                    }}
                  >
                    + {experience.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {!compareMode && displayedItems.length > 0 ? (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: C.textSoft, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6 }}>
                  Featured picks
                </div>
                <h3 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 24, color: C.text, margin: 0 }}>
                  Best places to start from this board
                </h3>
              </div>
              <div style={{ fontSize: 12, color: C.textSoft }}>
                Sorted by {sortMode === "best" ? "best match" : sortMode === "closest" ? "closest first" : sortMode === "easy" ? "easy effort" : "weather window"}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}>
              {featuredItems.map((experience, index) => (
                <div
                  key={`featured-${experience.id}`}
                  onClick={() => onViewDetail(experience)}
                  style={{
                    borderRadius: 20,
                    overflow: "hidden",
                    border: `1px solid ${C.borderLight}`,
                    background: "#fff",
                    boxShadow: "0 16px 34px rgba(61,107,78,0.08)",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ height: 200, position: "relative", overflow: "hidden" }}>
                    <CardImage experience={experience} style={{ height: 200 }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0.14) 48%, rgba(0,0,0,0.68) 100%)" }} />
                    <div style={{ position: "absolute", top: 14, left: 14 }}>
                      <Tag bg="rgba(255,255,255,0.82)" color={C.text}>{index === 0 ? "Best next pick" : index === 1 ? "Closest backup" : "Strong alternate"}</Tag>
                    </div>
                    <div style={{ position: "absolute", right: 14, top: 14 }}>
                      <ConditionBadge type={experience.conditionType} label={experience.condition} />
                    </div>
                    <div style={{ position: "absolute", left: 18, right: 18, bottom: 18 }}>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginBottom: 6 }}>
                        {experience.categoryLabel} · {experience.distance}
                      </div>
                      <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 26, lineHeight: 1.1, color: "#fff" }}>
                        {experience.title}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: "16px 18px 18px" }}>
                    <p style={{ margin: "0 0 12px", fontSize: 13, color: C.textMid, lineHeight: 1.7 }}>
                      {experience.hook}
                    </p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                      <Tag bg={C.greenLight} color={C.green}>{experience.difficulty}</Tag>
                      <Tag bg={C.tanLight} color={C.tan}>{experience.cost}</Tag>
                      <Tag bg="#EDE8DC" color="#6B6050">{experience.time}</Tag>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setPlanningExp(experience);
                        }}
                        style={{
                          padding: "9px 12px",
                          borderRadius: 10,
                          border: "none",
                          background: C.green,
                          color: "#fff",
                          cursor: "pointer",
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 12,
                        }}
                      >
                        Plan trip
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onViewDetail(experience);
                        }}
                        style={{
                          padding: "9px 12px",
                          borderRadius: 10,
                          border: `1px solid ${C.border}`,
                          background: "#fff",
                          color: C.textMid,
                          cursor: "pointer",
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 12,
                        }}
                      >
                        Open details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {displayedItems.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 40px", color: C.textSoft }}>
            <span style={{ fontSize: 40, display: "block", marginBottom: 14 }}>🌿</span>
            <p style={{ fontSize: 16, fontFamily: "'Libre Baskerville', serif" }}>
              {selectedItems.length === 0
                ? selectedCollection?.id === "saved" ? "Nothing saved yet" : "This collection is empty"
                : "No picks match this filter"}
            </p>
            <p style={{ fontSize: 13, marginTop: 8 }}>
              {selectedItems.length === 0
                ? selectedCollection?.id === "saved"
                  ? "Swipe right on experiences you love"
                  : "Add a few experiences from Saved to get this collection going"
                : "Try another board filter or sorting mode"}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {displayedItems.map((experience) => (
              <CollectionCard
                key={`${selectedCollection.id}-${experience.id}`}
                experience={experience}
                onViewDetail={onViewDetail}
                onRemove={(experienceId) => onRemoveFromCollection(selectedCollection.id, experienceId)}
                removeLabel={selectedCollection.id === "saved" ? "Remove from Saved" : "Remove from collection"}
                comparing={selectedItems.length >= 2}
                onToggleCompare={toggleCompare}
                compareSelected={compareIds.includes(experience.id)}
                compareDisabled={compareIds.length >= 3 && !compareIds.includes(experience.id)}
                onPlanTrip={setPlanningExp}
              />
            ))}
          </div>
        )}
      </div>

      {planningExp && (
        <TripPlanModal experience={planningExp} onClose={() => setPlanningExp(null)} />
      )}
    </div>
  );
}

export default CollectionsView;
