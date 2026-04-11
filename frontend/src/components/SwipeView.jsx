import { useState, useRef, useCallback } from "react";
import { C } from "../theme/palette.js";
import { CardImage } from "./CardImage.jsx";
import { SectionLabel, Tag, ConditionBadge } from "./ui.jsx";

function SwipeButton({ icon, borderColor, onClick, size = 52, fontSize = 22 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `2px solid ${borderColor}`,
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize,
        cursor: "pointer",
        transition: "transform 0.1s",
        color: borderColor,
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "scale(0.9)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {icon}
    </button>
  );
}

export function SwipeView({
  experiences,
  onViewDetail,
  onSave,
  onSkip,
  prefsSummary,
  sessionStats,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDir, setSwipeDir] = useState(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);

  const current = experiences[currentIndex];
  const next = experiences[currentIndex + 1];
  const after = experiences[currentIndex + 2];
  const perfectCount = experiences.filter((e) => e.conditionScore > 0.85).length;

  const handleSwipe = useCallback(
    (dir) => {
      setSwipeDir(dir);
      if (dir === "right") onSave(current.id);
      else onSkip(current.id);
      setTimeout(() => {
        // Parent removes this card from the deck; next card is always at index 0.
        setCurrentIndex(0);
        setSwipeDir(null);
        setDragX(0);
      }, 280);
    },
    [current, onSave, onSkip],
  );

  const onPointerDown = (e) => {
    startX.current = e.clientX;
    setIsDragging(true);
  };
  const onPointerMove = (e) => {
    if (isDragging) setDragX(e.clientX - startX.current);
  };
  const onPointerUp = () => {
    setIsDragging(false);
    if (Math.abs(dragX) > 100) handleSwipe(dragX > 0 ? "right" : "left");
    else setDragX(0);
  };

  if (!current) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 14,
          padding: 60,
        }}
      >
        <span style={{ fontSize: 48 }}>🌿</span>
        <p
          style={{
            fontFamily: "'Libre Baskerville', serif",
            fontSize: 20,
            color: C.green,
            textAlign: "center",
          }}
        >
          You've explored everything nearby!
        </p>
        <p style={{ fontSize: 14, color: C.textSoft, textAlign: "center" }}>
          Check back tomorrow for new conditions.
        </p>
      </div>
    );
  }

  const rotation = dragX * 0.04;
  const cardTransform = swipeDir
    ? `translateX(${swipeDir === "right" ? 700 : -700}px) rotate(${swipeDir === "right" ? 16 : -16}deg)`
    : `translateX(${dragX}px) rotate(${rotation}deg)`;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div
        style={{
          background: C.greenLight,
          padding: "8px 32px",
          display: "flex",
          flexDirection: "column",
          gap: prefsSummary ? 4 : 0,
          alignItems: "flex-start",
          fontSize: 13,
          color: C.green,
          fontWeight: 500,
          borderBottom: `1px solid ${C.borderLight}`,
          flexShrink: 0,
        }}
      >
        <span>
          ☀ {perfectCount} experiences are <strong>perfect</strong> for right now near Madison · 68°F, clear
        </span>
        {prefsSummary ? (
          <span style={{ fontSize: 12, fontWeight: 400, color: C.textMid, maxWidth: "100%" }}>
            For you: {prefsSummary}
          </span>
        ) : null}
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div
          style={{
            width: 240,
            flexShrink: 0,
            padding: "24px 20px",
            borderRight: `1px solid ${C.borderLight}`,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 18,
              border: `1px solid ${C.borderLight}`,
            }}
          >
            <SectionLabel>Today's Conditions</SectionLabel>
            {[
              { label: "Temp", value: "68°F" },
              { label: "Wind", value: "8 mph" },
              { label: "Sky", value: "Clear" },
              { label: "Golden hr", value: "7:42pm" },
            ].map((r, i, arr) => (
              <div
                key={r.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  paddingBottom: 8,
                  marginBottom: 8,
                  borderBottom: i < arr.length - 1 ? `1px solid ${C.borderLight}` : "none",
                }}
              >
                <span style={{ color: C.textSoft }}>{r.label}</span>
                <span style={{ fontWeight: 500, color: C.text }}>{r.value}</span>
              </div>
            ))}
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 18,
              border: `1px solid ${C.borderLight}`,
            }}
          >
            <SectionLabel>This Session</SectionLabel>
            {[
              {
                label: "Reviewed",
                value: sessionStats?.reviewed ?? currentIndex,
              },
              {
                label: "Left in deck",
                value: sessionStats?.remaining ?? Math.max(0, experiences.length - currentIndex),
              },
            ].map((r) => (
              <div
                key={r.label}
                style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}
              >
                <span style={{ color: C.textSoft }}>{r.label}</span>
                <span style={{ fontWeight: 500, color: C.green }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px 40px",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "relative", width: 380 }}>
            {after && (
              <div
                style={{
                  position: "absolute",
                  inset: "12px 12px 0",
                  borderRadius: 20,
                  background: "#fff",
                  border: `1px solid ${C.borderLight}`,
                  zIndex: 1,
                }}
              />
            )}
            {next && (
              <div
                style={{
                  position: "absolute",
                  inset: "6px 6px 0",
                  borderRadius: 20,
                  background: "#fff",
                  border: `1px solid ${C.border}`,
                  zIndex: 2,
                }}
              />
            )}

            <div
              style={{
                position: "relative",
                zIndex: 3,
                borderRadius: 20,
                background: "#fff",
                border: `1px solid ${C.border}`,
                overflow: "hidden",
                cursor: "grab",
                userSelect: "none",
                transform: cardTransform,
                transition: swipeDir ? "transform 0.28s ease" : isDragging ? "none" : "transform 0.18s ease",
                boxShadow: "0 8px 32px rgba(61,107,78,0.12)",
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerLeave={() => {
                if (isDragging) {
                  setIsDragging(false);
                  setDragX(0);
                }
              }}
            >
              {Math.abs(dragX) > 30 && (
                <div
                  style={{
                    position: "absolute",
                    top: 20,
                    zIndex: 10,
                    padding: "8px 20px",
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 17,
                    letterSpacing: 2,
                    ...(dragX > 0
                      ? {
                          left: 20,
                          border: `3px solid ${C.green}`,
                          color: C.green,
                          transform: "rotate(-15deg)",
                        }
                      : {
                          right: 20,
                          border: "3px solid #C4A882",
                          color: "#C4A882",
                          transform: "rotate(15deg)",
                        }),
                  }}
                >
                  {dragX > 0 ? "SAVE" : "SKIP"}
                </div>
              )}

              <div style={{ position: "relative" }}>
                <CardImage experience={current} />
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "44px 20px 16px",
                    background: "linear-gradient(transparent, rgba(0,0,0,0.6))",
                  }}
                >
                  <h2
                    style={{
                      fontFamily: "'Libre Baskerville', serif",
                      fontSize: 19,
                      fontWeight: 700,
                      color: "#fff",
                      margin: 0,
                      lineHeight: 1.3,
                    }}
                  >
                    {current.title}
                  </h2>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", margin: "4px 0 0" }}>
                    {current.location} · {current.distance} away
                  </p>
                </div>
                <div style={{ position: "absolute", top: 14, right: 14 }}>
                  <ConditionBadge type={current.conditionType} label={current.condition} />
                </div>
              </div>

              <div style={{ padding: "16px 20px 20px" }}>
                <p
                  style={{
                    fontFamily: "'Libre Baskerville', serif",
                    fontSize: 13,
                    color: C.textMid,
                    lineHeight: 1.6,
                    fontStyle: "italic",
                    margin: "0 0 14px",
                  }}
                >
                  "{current.hook}"
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                  <Tag bg={C.greenLight} color={C.green}>
                    {current.difficulty}
                  </Tag>
                  <Tag bg={C.tanLight} color={C.tan}>
                    {current.cost}
                  </Tag>
                  <Tag bg="#EDE8DC" color="#6B6050">
                    {current.time}
                  </Tag>
                  {current.kidFriendly && (
                    <Tag bg={C.greenLight} color={C.green}>
                      Kid-friendly
                    </Tag>
                  )}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: C.textSoft }}>{current.season}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetail(current);
                    }}
                    style={{
                      fontSize: 12,
                      color: C.green,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textDecoration: "underline",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    View details →
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 20,
              marginTop: 24,
            }}
          >
            <SwipeButton icon="✕" borderColor="#C4A882" onClick={() => handleSwipe("left")} />
            <SwipeButton
              icon="▲"
              borderColor={C.greenMid}
              size={44}
              fontSize={16}
              onClick={() => onViewDetail(current)}
            />
            <SwipeButton icon="♥" borderColor={C.green} onClick={() => handleSwipe("right")} />
          </div>
          <p style={{ fontSize: 11, color: C.textSoft, marginTop: 10, letterSpacing: 0.5 }}>
            drag · or click · drag right to save
          </p>
        </div>

        <div
          style={{
            width: 240,
            flexShrink: 0,
            padding: "24px 20px",
            borderLeft: `1px solid ${C.borderLight}`,
            overflowY: "auto",
          }}
        >
          <SectionLabel>Up Next</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {experiences.slice(currentIndex + 1, currentIndex + 5).map((exp) => (
              <div
                key={exp.id}
                role="button"
                tabIndex={0}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "#fff",
                  border: `1px solid ${C.borderLight}`,
                  cursor: "pointer",
                }}
                onClick={() => onViewDetail(exp)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onViewDetail(exp);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = C.greenMid;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = C.borderLight;
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                  <CardImage experience={exp} style={{ width: 36, height: 36 }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: C.text,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {exp.title}
                  </div>
                  <div style={{ fontSize: 11, color: C.textSoft }}>
                    {exp.distance} · {exp.difficulty}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
