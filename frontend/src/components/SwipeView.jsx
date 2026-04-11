import { useState, useRef, useCallback, useEffect } from "react";
import { C } from "../theme/palette.js";
import { CardImage } from "./CardImage.jsx";
import { SectionLabel, Tag, ConditionBadge } from "./ui.jsx";
import { formatInsightLine, getDeckNarrative, getWhyForYou, getWhyNow } from "../lib/insights.js";
import { Drifty } from "./Drifty.jsx";

function SwipeButton({ icon, label, borderColor, onClick, size = 58, fontSize = 22, fill }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <button
        type="button"
        onClick={onClick}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          border: `2px solid ${borderColor}`,
          background: fill || "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize,
          cursor: "pointer",
          transition: "transform 0.1s, box-shadow 0.2s",
          color: borderColor,
          boxShadow: "0 10px 24px rgba(61,107,78,0.12)",
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = "scale(0.92)";
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        {icon}
      </button>
      <span style={{ fontSize: 11, color: C.textSoft, letterSpacing: 0.4 }}>{label}</span>
    </div>
  );
}

function MetricRow({ label, value, icon }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        fontSize: 13,
        paddingBottom: 8,
        marginBottom: 8,
        borderBottom: `1px solid ${C.borderLight}`,
      }}
    >
      <span style={{ color: C.textSoft, display: "flex", alignItems: "center", gap: 8 }}>
        <span>{icon}</span>
        {label}
      </span>
      <span style={{ fontWeight: 600, color: C.text }}>{value}</span>
    </div>
  );
}

function DashboardCard({ title, children, accent, contentStyle }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.82)",
        borderRadius: 22,
        padding: "18px 16px 16px",
        border: `1px solid ${C.borderLight}`,
        boxShadow: "0 18px 40px rgba(61,107,78,0.08)",
        backdropFilter: "blur(16px)",
        position: "relative",
        overflow: "visible",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: accent || `linear-gradient(90deg, ${C.green}, ${C.greenMid})`,
          opacity: 0.9,
        }}
      />
      <SectionLabel>{title}</SectionLabel>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 0,
          minHeight: 0,
          ...contentStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function InsightBlock({ label, text }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: C.textSoft, textTransform: "uppercase", letterSpacing: 1.1, marginBottom: 6 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 12,
          color: C.text,
          lineHeight: 1.6,
          display: "-webkit-box",
          WebkitLineClamp: 4,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function DriftyTip({ text }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: "linear-gradient(180deg, rgba(232,240,229,0.96), rgba(245,240,230,0.96))",
          border: `1px solid ${C.borderLight}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Drifty size={50} pose="wave" />
      </div>
      <div>
        <div style={{ fontSize: 11, color: C.textSoft, textTransform: "uppercase", letterSpacing: 1.1, marginBottom: 4 }}>
          Drifty Says
        </div>
        <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>
          {text}
        </div>
      </div>
    </div>
  );
}

function FloatingNote({ title, text, align = "left", tone = "green" }) {
  const tones = {
    green: {
      background: "rgba(232,240,229,0.82)",
      border: C.greenLight,
    },
    tan: {
      background: "rgba(245,240,230,0.88)",
      border: C.borderLight,
    },
  };

  return (
    <div
      style={{
        position: "absolute",
        top: align === "left" ? 96 : 168,
        [align]: -164,
        width: 180,
        padding: "14px 15px",
        borderRadius: 18,
        background: tones[tone].background,
        border: `1px solid ${tones[tone].border}`,
        boxShadow: "0 18px 40px rgba(61,107,78,0.12)",
        backdropFilter: "blur(14px)",
        zIndex: 4,
        pointerEvents: "none",
      }}
    >
      <div style={{ fontSize: 10, color: C.textSoft, textTransform: "uppercase", letterSpacing: 1.1, marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>
        {text}
      </div>
    </div>
  );
}

function StackPreviewCard({ experience, inset, zIndex, scale = 1, opacity = 1 }) {
  if (!experience) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset,
        borderRadius: 28,
        overflow: "hidden",
        zIndex,
        transform: `scale(${scale})`,
        opacity,
        border: `1px solid ${C.borderLight}`,
        boxShadow: "0 20px 44px rgba(61,107,78,0.08)",
        background: "#fff",
      }}
    >
      <div style={{ position: "relative", height: 230 }}>
        <CardImage experience={experience} style={{ height: 230 }} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.18) 46%, rgba(0,0,0,0.68) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "34px 18px 16px",
          }}
        >
          <div
            style={{
              fontFamily: "'Libre Baskerville', serif",
              fontSize: 20,
              lineHeight: 1.12,
              color: "#fff",
              marginBottom: 6,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {experience.title}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>
            {experience.distance} · {experience.difficulty}
          </div>
        </div>
      </div>
      <div style={{ padding: "12px 16px 14px" }}>
        <div
          style={{
            fontSize: 12,
            color: C.textSoft,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            lineHeight: 1.5,
          }}
        >
          {experience.hook}
        </div>
      </div>
    </div>
  );
}

function NotificationToast({ notice }) {
  if (!notice) return null;

  const styles = {
    save: {
      bg: "rgba(232,240,229,0.96)",
      border: C.green,
      title: "Saved to collection",
      icon: "💚",
    },
    skip: {
      bg: "rgba(245,240,230,0.96)",
      border: "#C4A882",
      title: "Skipped for now",
      icon: "↺",
    },
    detail: {
      bg: "rgba(230,238,247,0.96)",
      border: "#3A8DBF",
      title: "Opening details",
      icon: "↑",
    },
  };

  const style = styles[notice.type] || styles.save;

  return (
    <div
      style={{
        position: "absolute",
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        minWidth: 280,
        zIndex: 20,
        padding: "14px 18px",
        borderRadius: 18,
        background: style.bg,
        border: `1px solid ${style.border}`,
        boxShadow: "0 24px 60px rgba(42,54,43,0.18)",
        backdropFilter: "blur(14px)",
        animation: "toastFloat 0.35s ease both",
        pointerEvents: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 14,
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
          }}
        >
          {style.icon}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{style.title}</div>
          <div style={{ fontSize: 12, color: C.textMid }}>{notice.message}</div>
        </div>
      </div>
    </div>
  );
}

function getDriftyPose(experience, noticeType) {
  if (noticeType === "save") return "sparkle";
  if (noticeType === "detail") return "clipboard";
  if (experience?.conditionType === "perfect") return "sparkle";
  if (experience?.category === "hiking" || experience?.category === "wildlife") return "wave";
  return "clipboard";
}

export function SwipeView({
  experiences,
  onViewDetail,
  onSave,
  onSkip,
  collections = [],
  swipeCollectionId = "saved",
  onSwipeCollectionChange,
  locationLabel = "Madison, WI",
  prefsSummary,
  sessionStats,
  prefs,
  weather,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDir, setSwipeDir] = useState(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [notice, setNotice] = useState(null);
  const startX = useRef(0);

  const current = experiences[currentIndex];
  const next = experiences[currentIndex + 1];
  const after = experiences[currentIndex + 2];
  const strongFitCount = experiences.filter(
    (experience) => experience.conditionType === "perfect" || experience.conditionType === "great",
  ).length;
  const headlineCount = experiences.length > 0 ? Math.max(1, strongFitCount) : 0;
  const swipeTarget = collections.find((collection) => collection.id === swipeCollectionId) ?? collections[0];
  const currentWhyForYou = current ? getWhyForYou(current, prefs || {}) : [];
  const currentWhyNow = current ? getWhyNow(current) : [];
  const deckNarrative = getDeckNarrative(experiences, prefs || {});
  const heroDriftyPose = getDriftyPose(current, notice?.type);
  const driftyTip = current
    ? `${current.title.split(" — ")[0]} is reading like a smart ${current.time.toLowerCase()} move. ${current.conditionType === "perfect" ? "I’d jump on this one early." : "Feels like a solid card to keep in play."}`
    : "I’m keeping the deck moving with the best-fit ideas for right now.";

  const showNotice = useCallback((type, message) => {
    setNotice({ type, message });
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    setCurrentIndex(0);
    setSwipeDir(null);
    setDragX(0);
    setIsDragging(false);
  }, [experiences]);

  const handleSwipe = useCallback(
    (dir) => {
      setSwipeDir(dir);
      if (dir === "right") {
        onSave(current.id);
        showNotice("save", swipeTarget?.id === "saved" ? "Added to Saved." : `Added to ${swipeTarget?.label} and Saved.`);
      } else {
        onSkip(current.id);
        showNotice("skip", "We’ll bring you something with a different vibe.");
      }
      setTimeout(() => {
        setCurrentIndex(0);
        setSwipeDir(null);
        setDragX(0);
      }, 280);
    },
    [current, onSave, onSkip, showNotice, swipeTarget],
  );

  const handleViewDetails = useCallback((experience) => {
    showNotice("detail", `${experience.title} is opening in the editorial view.`);
    window.setTimeout(() => onViewDetail(experience), 120);
  }, [onViewDetail, showNotice]);

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

  useEffect(() => {
    if (!current) return undefined;

    function handleKeyDown(event) {
      const target = event.target;
      const isTypingTarget =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if (isTypingTarget || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        handleSwipe("left");
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        handleSwipe("right");
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        handleViewDetails(current);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [current, handleSwipe, handleViewDetails]);

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
          background:
            "radial-gradient(circle at center, rgba(123,168,138,0.18), transparent 42%), linear-gradient(180deg, #f7f4ee 0%, #faf9f6 100%)",
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
    ? `translateX(${swipeDir === "right" ? 760 : -760}px) rotate(${swipeDir === "right" ? 16 : -16}deg)`
    : `translateX(${dragX}px) rotate(${rotation}deg)`;

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background:
          "radial-gradient(circle at 50% 32%, rgba(123,168,138,0.18), transparent 24%), radial-gradient(circle at 76% 18%, rgba(196,168,130,0.16), transparent 20%), linear-gradient(180deg, #f7f4ee 0%, #faf9f6 100%)",
      }}
    >
      <div
        style={{
          padding: "14px 24px 12px",
          borderBottom: `1px solid ${C.borderLight}`,
          background: "rgba(246,248,241,0.84)",
          backdropFilter: "blur(12px)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: 18,
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderRadius: 20,
              background: "linear-gradient(135deg, rgba(232,240,229,0.98), rgba(245,240,230,0.94))",
              border: `1px solid ${C.borderLight}`,
              boxShadow: "0 12px 32px rgba(61,107,78,0.08)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                right: 16,
                top: 12,
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px 8px 8px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.66)",
                border: `1px solid ${C.borderLight}`,
                backdropFilter: "blur(12px)",
              }}
            >
              <Drifty size={38} pose="sparkle" />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10, color: C.textSoft, textTransform: "uppercase", letterSpacing: 1.1 }}>
                  Drifty Radar
                </div>
                <div style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>
                  Deck is live
                </div>
              </div>
            </div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.2, color: C.textSoft, marginBottom: 8 }}>
              Today Near {locationLabel}
            </div>
            <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 28, color: C.text, marginBottom: 6 }}>
              {headlineCount} strong-fit idea{headlineCount === 1 ? "" : "s"} for right now
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>{weather?.summary || "Live weather unavailable"}</span>
              <span style={{ fontSize: 13, color: C.textSoft }}>
                {prefsSummary ? `Tuned for ${prefsSummary}` : "Editorially ranked for the moment"}
              </span>
            </div>
          </div>

          <div
            style={{
              padding: "16px 18px",
              borderRadius: 20,
              background: "rgba(255,255,255,0.82)",
              border: `1px solid ${C.borderLight}`,
              boxShadow: "0 12px 32px rgba(61,107,78,0.06)",
            }}
          >
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.2, color: C.textSoft, marginBottom: 8 }}>
              Editorial Read
            </div>
            <div style={{ fontSize: 14, color: C.text, lineHeight: 1.6 }}>
              {deckNarrative}
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        <div
          style={{
            width: 276,
            flexShrink: 0,
            padding: "22px 18px",
            borderRight: `1px solid ${C.borderLight}`,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            overflowY: "auto",
            background: "rgba(250,249,246,0.58)",
            minHeight: 0,
          }}
        >
          <DashboardCard title="Today's Conditions">
            <MetricRow label="Temp" value={weather?.temperature || "--"} icon="☀" />
            <MetricRow label="Wind" value={weather?.wind || "--"} icon="➳" />
            <MetricRow label="Sky" value={weather?.sky || "--"} icon="◌" />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: C.textSoft, display: "flex", alignItems: "center", gap: 8 }}>
                <span>✦</span>
                Sunset
              </span>
              <span style={{ fontWeight: 600, color: C.text }}>{weather?.sunset || "--"}</span>
            </div>
          </DashboardCard>

          <DashboardCard
            title="Right Swipe Target"
            accent={`linear-gradient(90deg, ${C.greenMid}, ${C.green})`}
            contentStyle={{ maxHeight: 220, overflowY: "auto", paddingRight: 2 }}
          >
            <div style={{ fontSize: 12, color: C.textSoft, marginBottom: 12 }}>
              Right swipes land in Saved{swipeTarget?.id !== "saved" ? ` and ${swipeTarget?.label}` : ""}.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {collections.map((collection) => {
                const active = collection.id === swipeCollectionId;
                return (
                  <button
                    key={collection.id}
                    type="button"
                    onClick={() => onSwipeCollectionChange?.(collection.id)}
                    style={{
                      width: "100%",
                      justifyContent: "flex-start",
                      padding: "10px 12px",
                      borderRadius: 999,
                      border: `1px solid ${active ? C.green : C.border}`,
                      background: active ? C.greenLight : "#fff",
                      color: active ? C.green : C.textMid,
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 12,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                    }}
                  >
                    <span>{collection.icon}</span>
                    <span>{collection.label}</span>
                  </button>
                );
              })}
            </div>
          </DashboardCard>

          <DashboardCard title="This Session" accent={`linear-gradient(90deg, ${C.tan}, ${C.greenMid})`}>
            <MetricRow label="Reviewed" value={sessionStats?.reviewed ?? currentIndex} icon="⟲" />
            <MetricRow label="Left in deck" value={sessionStats?.remaining ?? Math.max(0, experiences.length - currentIndex)} icon="☰" />
            <div style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.55, paddingTop: 2 }}>
              Calm-discovery pocket. Scenic, lower-effort ideas are still surfacing ahead of bigger hauls.
            </div>
          </DashboardCard>

          <DashboardCard
            title="Drifty's Tip"
            accent={`linear-gradient(90deg, ${C.greenMid}, ${C.tan})`}
            contentStyle={{ maxHeight: 170, overflowY: "auto", paddingRight: 2 }}
          >
            <DriftyTip text={driftyTip} />
          </DashboardCard>

          <DashboardCard
            title="Why This Card"
            accent={`linear-gradient(90deg, ${C.green}, ${C.tan})`}
            contentStyle={{ maxHeight: 220, overflowY: "auto", paddingRight: 2 }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <InsightBlock label="Why this fits" text={formatInsightLine(currentWhyForYou)} />
              <InsightBlock label="Why now" text={formatInsightLine(currentWhyNow)} />
            </div>
          </DashboardCard>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px 40px 34px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <NotificationToast notice={notice} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at center, rgba(123,168,138,0.16), transparent 20%), linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.36) 50%, transparent 100%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 720,
              height: 720,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(61,107,78,0.12), rgba(61,107,78,0.02) 55%, transparent 72%)",
              filter: "blur(8px)",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative", width: 520, overflow: "visible" }}>
            <FloatingNote
              title="Why Now"
              text={formatInsightLine(currentWhyNow)}
              align="left"
              tone="green"
            />
            <FloatingNote
              title="Field Notes"
              text={`Best for ${current.categoryLabel.toLowerCase()} days, ${current.time.toLowerCase()} windows, and ${current.difficulty.toLowerCase()} effort.`}
              align="right"
              tone="tan"
            />
            <StackPreviewCard
              experience={after}
              inset="20px 28px 0"
              zIndex={1}
              scale={0.975}
              opacity={0.62}
            />
            <StackPreviewCard
              experience={next}
              inset="10px 18px 0"
              zIndex={2}
              scale={0.988}
              opacity={0.82}
            />

            <div
              style={{
                position: "relative",
                zIndex: 3,
                borderRadius: 28,
                background: "#fff",
                border: `1px solid ${C.border}`,
                overflow: "hidden",
                cursor: "grab",
                userSelect: "none",
                transform: cardTransform,
                transition: swipeDir ? "transform 0.28s ease" : isDragging ? "none" : "transform 0.18s ease",
                boxShadow: "0 34px 74px rgba(61,107,78,0.18)",
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
              {Math.abs(dragX) > 30 ? (
                <div
                  style={{
                    position: "absolute",
                    top: 22,
                    zIndex: 10,
                    padding: "10px 22px",
                    borderRadius: 12,
                    fontWeight: 800,
                    fontSize: 18,
                    letterSpacing: 2,
                    background: "rgba(255,255,255,0.88)",
                    ...(dragX > 0
                      ? {
                          left: 22,
                          border: `2px solid ${C.green}`,
                          color: C.green,
                          transform: "rotate(-12deg)",
                        }
                      : {
                          right: 22,
                          border: "2px solid #C4A882",
                          color: "#C4A882",
                          transform: "rotate(12deg)",
                        }),
                  }}
                >
                  {dragX > 0 ? "SAVE" : "SKIP"}
                </div>
              ) : null}

              <div style={{ position: "relative" }}>
                <CardImage experience={current} style={{ height: 350 }} />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(180deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.14) 45%, rgba(0,0,0,0.72) 100%)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: 18,
                    left: 18,
                    padding: "8px 12px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.16)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    color: "#fff",
                    fontSize: 11,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  Editorial pick
                </div>
                <div
                  style={{
                    position: "absolute",
                    right: 18,
                    top: 60,
                    width: 68,
                    height: 68,
                    padding: 5,
                    borderRadius: 18,
                    background: "rgba(255,255,255,0.14)",
                    border: "1px solid rgba(255,255,255,0.22)",
                    backdropFilter: "blur(8px)",
                    pointerEvents: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Drifty size={54} pose={heroDriftyPose} style={{ opacity: 0.98 }} />
                </div>
                <div style={{ position: "absolute", top: 18, right: 18 }}>
                  <ConditionBadge type={current.conditionType} label={current.condition} />
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "58px 26px 24px",
                  }}
                >
                  <h2
                    style={{
                      fontFamily: "'Libre Baskerville', serif",
                      fontSize: 34,
                      fontWeight: 700,
                      color: "#fff",
                      margin: "0 0 10px",
                      lineHeight: 1.1,
                    }}
                  >
                    {current.title}
                  </h2>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.78)", margin: 0 }}>
                    {current.location} · {current.distance} away
                  </p>
                </div>
              </div>

              <div style={{ padding: "22px 26px 24px" }}>
                <p
                  style={{
                    fontFamily: "'Libre Baskerville', serif",
                    fontSize: 15,
                    color: C.textMid,
                    lineHeight: 1.65,
                    fontStyle: "italic",
                    margin: "0 0 16px",
                  }}
                >
                  "{current.hook}"
                </p>
                <div
                  style={{
                    marginBottom: 16,
                    padding: "12px 14px",
                    borderRadius: 14,
                    background: "rgba(245,240,230,0.72)",
                    border: `1px solid ${C.borderLight}`,
                  }}
                >
                  <div style={{ fontSize: 11, color: C.textSoft, textTransform: "uppercase", letterSpacing: 1.1, marginBottom: 6 }}>
                    Why this fits
                  </div>
                  <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>
                    {formatInsightLine(currentWhyForYou)}
                  </div>
                </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
                  <Tag bg={C.greenLight} color={C.green}>{current.difficulty}</Tag>
                  <Tag bg={C.tanLight} color={C.tan}>{current.cost}</Tag>
                  <Tag bg="#EDE8DC" color="#6B6050">{current.time}</Tag>
                  {current.kidFriendly ? (
                    <Tag bg={C.greenLight} color={C.green}>Kid-friendly</Tag>
                  ) : null}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: C.textSoft }}>{current.season}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(current);
                    }}
                    style={{
                      fontSize: 13,
                      color: C.green,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Open editorial details →
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
              gap: 26,
              marginTop: 28,
            }}
          >
            <SwipeButton icon="✕" label="Skip" borderColor="#C4A882" onClick={() => handleSwipe("left")} />
            <SwipeButton
              icon="▲"
              label="Details"
              borderColor={C.greenMid}
              size={52}
              fontSize={17}
              fill="rgba(255,255,255,0.92)"
              onClick={() => handleViewDetails(current)}
            />
            <SwipeButton icon="♥" label="Save" borderColor={C.green} onClick={() => handleSwipe("right")} />
          </div>
          <p style={{ fontSize: 11, color: C.textSoft, marginTop: 12, letterSpacing: 0.5 }}>
            drag or click · ← skip · → save · ↑ details
          </p>
        </div>

        <div
          style={{
            width: 280,
            flexShrink: 0,
            padding: "24px 20px",
            borderLeft: `1px solid ${C.borderLight}`,
            overflowY: "auto",
            background: "rgba(250,249,246,0.62)",
          }}
        >
          <DashboardCard title="Up Next" accent={`linear-gradient(90deg, ${C.greenMid}, ${C.tan})`}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {experiences.slice(currentIndex + 1, currentIndex + 5).map((exp, index) => (
                <div
                  key={exp.id}
                  role="button"
                  tabIndex={0}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    padding: "12px 12px",
                    borderRadius: 16,
                    background: "#fff",
                    border: `1px solid ${C.borderLight}`,
                    cursor: "pointer",
                    boxShadow: "0 10px 22px rgba(61,107,78,0.05)",
                    animation: `fadeRise 0.35s ease ${index * 70}ms both`,
                  }}
                  onClick={() => handleViewDetails(exp)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") handleViewDetails(exp);
                  }}
                >
                  <div style={{ width: 56, height: 56, borderRadius: 12, overflow: "hidden", flexShrink: 0 }}>
                    <CardImage experience={exp} style={{ height: 56 }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {exp.title}
                    </div>
                    <div style={{ fontSize: 11, color: C.textSoft }}>
                      {exp.distance} · {exp.difficulty}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      </div>

      <style>{`
        @keyframes toastFloat {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        @keyframes fadeRise {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default SwipeView;
