import { useState } from "react";
import { C } from "../theme/palette.js";
import { Tag, ConditionBadge } from "./ui.jsx";
import { CardImage } from "./CardImage.jsx";

export function CollectionsView({ savedIds, experiences, onViewDetail }) {
  const [activeCol, setActiveCol] = useState("saved");
  const saved = experiences.filter((experience) => savedIds.includes(experience.id));

  const collections = [
    { id: "saved", label: "Saved", icon: "💚", items: saved },
    { id: "bucket", label: "Bucket List", icon: "⭐", items: saved.slice(0, Math.ceil(saved.length / 2)) },
    { id: "summer", label: "Summer 2026", icon: "☀️", items: [] },
    { id: "trips", label: "Day Trips", icon: "🚗", items: [] },
  ];

  const selectedCollection = collections.find((collection) => collection.id === activeCol);
  const items = selectedCollection?.items || [];

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
      <div
        style={{
          width: 220,
          flexShrink: 0,
          borderRight: `1px solid ${C.borderLight}`,
          padding: "24px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
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
            marginBottom: 8,
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
              {collection.items.length}
            </span>
          </button>
        ))}

        <button
          style={{
            marginTop: 8,
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
      </div>

      <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 24, color: C.text, margin: "0 0 4px" }}>
              {selectedCollection?.icon} {selectedCollection?.label}
            </h2>
            <p style={{ fontSize: 13, color: C.textSoft }}>
              {items.length} experience{items.length !== 1 ? "s" : ""} saved
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 40px", color: C.textSoft }}>
            <span style={{ fontSize: 40, display: "block", marginBottom: 14 }}>🌿</span>
            <p style={{ fontSize: 16, fontFamily: "'Libre Baskerville', serif" }}>Nothing saved yet</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>Swipe right on experiences you love</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {items.map((experience) => (
              <div
                key={experience.id}
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
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Tag bg={C.greenLight} color={C.green}>{experience.difficulty}</Tag>
                    <Tag bg={C.tanLight} color={C.tan}>{experience.cost}</Tag>
                    <ConditionBadge type={experience.conditionType} label={experience.condition} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CollectionsView;
