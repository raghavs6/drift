import { C } from "../theme/palette.js";
import { SectionLabel, Tag, ConditionBadge } from "./ui.jsx";
import { CardImage } from "./CardImage.jsx";

export function DetailView({ experience, onBack, onSave, isSaved }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px" }}>
      <button
        onClick={onBack}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 24,
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 14,
          color: C.textSoft,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        ← Back to Discover
      </button>

      <div style={{ display: "flex", gap: 40 }}>
        <div style={{ width: "42%", flexShrink: 0 }}>
          <div
            style={{
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 4px 24px rgba(61,107,78,0.12)",
              marginBottom: 12,
            }}
          >
            <CardImage experience={experience} style={{ height: 300 }} />
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                style={{
                  flex: 1,
                  height: 60,
                  borderRadius: 10,
                  overflow: "hidden",
                  outline: index === 0 ? `2px solid ${C.green}` : "2px solid transparent",
                  outlineOffset: 2,
                  cursor: "pointer",
                }}
              >
                <CardImage
                  experience={{
                    ...experience,
                    images: [
                      experience.images[index],
                      experience.images[(index + 1) % 3],
                      experience.images[(index + 2) % 3],
                    ],
                  }}
                />
              </div>
            ))}
          </div>

          <div
            style={{
              borderRadius: 16,
              background: C.borderLight,
              height: 160,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 6,
              color: C.textSoft,
              border: `1px solid ${C.border}`,
            }}
          >
            <span style={{ fontSize: 28 }}>🗺️</span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{experience.location}</span>
            <span style={{ fontSize: 12 }}>{experience.distance} away</span>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: C.textSoft, textTransform: "uppercase", letterSpacing: 1 }}>
              {experience.categoryLabel}
            </span>
            <ConditionBadge type={experience.conditionType} label={experience.condition} large />
          </div>

          <h1
            style={{
              fontFamily: "'Libre Baskerville', serif",
              fontSize: 28,
              fontWeight: 700,
              color: C.text,
              margin: "0 0 8px",
              lineHeight: 1.3,
            }}
          >
            {experience.title}
          </h1>
          <p
            style={{
              fontFamily: "'Libre Baskerville', serif",
              fontSize: 14,
              color: C.textMid,
              fontStyle: "italic",
              margin: "0 0 20px",
            }}
          >
            "{experience.hook}"
          </p>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
            <Tag bg={C.greenLight} color={C.green}>{experience.difficulty}</Tag>
            <Tag bg={C.tanLight} color={C.tan}>{experience.cost}</Tag>
            <Tag bg="#EDE8DC" color="#6B6050">{experience.time}</Tag>
            <Tag bg={C.borderLight} color={C.textMid}>{experience.season}</Tag>
            {experience.kidFriendly ? (
              <Tag bg={C.greenLight} color={C.green}>
                Kid-friendly {experience.minAge > 0 ? `(${experience.minAge}+)` : ""}
              </Tag>
            ) : null}
          </div>

          <p style={{ fontSize: 14, color: C.text, lineHeight: 1.8, margin: "0 0 12px" }}>{experience.description}</p>
          <p style={{ fontSize: 14, color: C.text, lineHeight: 1.8, margin: "0 0 24px" }}>{experience.description2}</p>

          <SectionLabel>What to bring</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
            {experience.whatToBring.map((item) => (
              <span
                key={item}
                style={{
                  padding: "8px 14px",
                  borderRadius: 10,
                  background: C.tanLight,
                  fontSize: 13,
                  color: C.textMid,
                }}
              >
                {item}
              </span>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => onSave(experience.id)}
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: 14,
                border: "none",
                cursor: "pointer",
                fontSize: 15,
                fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.15s",
                background: isSaved ? C.greenLight : C.green,
                color: isSaved ? C.green : "#fff",
              }}
            >
              {isSaved ? "✓ Saved" : "Save to collection"}
            </button>
            <button
              style={{
                padding: "14px 20px",
                borderRadius: 14,
                border: `1px solid ${C.border}`,
                background: "#fff",
                color: C.textMid,
                fontSize: 14,
                fontFamily: "'DM Sans', sans-serif",
                cursor: "pointer",
              }}
            >
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetailView;
