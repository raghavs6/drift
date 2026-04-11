import { useState, useEffect, useMemo, useCallback } from "react";
import { C } from "./theme/palette.js";
import rawExperiencesMidwest from "./data/experiences.json";
import { normalizeExperiences } from "./data/normalizeExperiences.js";
import { SectionLabel, Tag, ConditionBadge } from "./components/ui.jsx";
import { CardImage } from "./components/CardImage.jsx";
import { SwipeView } from "./components/SwipeView.jsx";
import { buildDiscoverDeck, mergePrefs, DEFAULT_PREFS } from "./lib/discoverDeck.js";
import { loadPersistedState, savePersistedState } from "./lib/persistence.js";
import { WelcomeScreen } from "./components/WelcomeScreen.jsx";
import { supabase } from "./supabase.js";

// ─── Google Fonts ─────────────────────────────────────────────────────────────
// Libre Baskerville (serif headings) + DM Sans (body) — loaded in root useEffect

// Midwest MVP seed data — swap for API later; normalize adds condition fields
const EXPERIENCES = normalizeExperiences(rawExperiencesMidwest);

const initialPersisted =
  typeof window !== "undefined" ? loadPersistedState() : null;

function formatPrefsSummary(prefs) {
  const vibeLabels = (prefs.vibes || [])
    .map((id) => CATEGORIES.find((c) => c.id === id)?.label)
    .filter(Boolean);
  const vibesText = vibeLabels.length ? vibeLabels.join(" · ") : "All activities";
  const bits = [vibesText, `Within ${prefs.distance || "30 min"}`];
  if (prefs.kidFriendly) bits.push("Kid-friendly");
  return bits.join(" · ");
}

const CATEGORIES = [
  { id: "hiking",     label: "Hiking",     icon: "🥾" },
  { id: "water",      label: "Water",      icon: "🛶" },
  { id: "climbing",   label: "Climbing",   icon: "🧗" },
  { id: "biking",     label: "Biking",     icon: "🚵" },
  { id: "camping",    label: "Camping",    icon: "⛺" },
  { id: "fishing",    label: "Fishing",    icon: "🎣" },
  { id: "stargazing", label: "Stargazing", icon: "✨" },
  { id: "wildlife",   label: "Wildlife",   icon: "🦅" },
  { id: "foraging",   label: "Foraging",   icon: "🍄" },
];

const DISTANCES = ["15 min", "30 min", "1 hr", "2 hr"];
const AGES      = ["18–24", "25–34", "35–44", "45–54", "55+"];
const COMFORT   = [
  { label: "Casual",      desc: "Flat terrain, easy access, family pace" },
  { label: "Moderate",    desc: "Some elevation, moderate effort" },
  { label: "Adventurous", desc: "Challenging terrain, higher effort" },
];

// ─── SVG Helpers ──────────────────────────────────────────────────────────────

const TreeLine = ({ style }) => (
  <svg viewBox="0 0 400 60" style={{ width: "100%", height: 60, ...style }}>
    {[0,30,55,80,110,140,165,195,220,250,275,305,330,360].map((x, i) => (
      <path key={i}
        d={`M${x+15} 58 L${x+15} 35 L${x+5} 35 L${x+15} 15 L${x+8} 15 L${x+15} 0 L${x+22} 15 L${x+15} 15 L${x+25} 35 L${x+15} 35Z`}
        fill={C.green} opacity={0.04 + (i % 3) * 0.02} />
    ))}
  </svg>
);

// ─── Utility Components ───────────────────────────────────────────────────────

const ChipRow = ({ options, selected, onSelect }) => (
  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
    {options.map(o => (
      <button key={o} onClick={() => onSelect(o)}
        style={{ padding: "10px 20px", borderRadius: 24, fontSize: 13, fontWeight: 500,
          fontFamily: "'DM Sans', sans-serif",
          background: selected === o ? C.green : "#fff",
          color:      selected === o ? "#fff"  : C.textMid,
          border:     `1px solid ${selected === o ? C.green : C.border}`,
          cursor: "pointer", transition: "all 0.15s" }}>
        {o}
      </button>
    ))}
  </div>
);

const ToggleSwitch = ({ on }) => (
  <div style={{ width: 44, height: 24, borderRadius: 12,
    background: on ? C.green : C.borderLight, position: "relative",
    cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
    <div style={{ width: 20, height: 20, borderRadius: 10, background: "#fff",
      position: "absolute", top: 2, left: on ? 22 : 2,
      transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
  </div>
);

// ─── Top Navigation ───────────────────────────────────────────────────────────

function TopNav({ tab, onTab, onSignOut, savedCount = 0, maxTravelLabel = "30 min" }) {
  return (
    <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, height: 56,
      background: "rgba(250,249,246,0.92)", backdropFilter: "blur(8px)",
      borderBottom: `1px solid ${C.borderLight}`, display: "flex", alignItems: "center",
      padding: "0 32px", gap: 24, fontFamily: "'DM Sans', sans-serif" }}>

      <span style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 22,
        fontWeight: 700, color: C.green }}>drift</span>

      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
        borderRadius: 10, background: "#fff", border: `1px solid ${C.border}`,
        fontSize: 13, color: C.textMid }}>
        <span style={{ color: C.green }}>●</span> Madison, WI · {maxTravelLabel} max
      </div>

      <nav style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
        {[
          { id: "discover", label: "Discover" },
          { id: "saved",    label: `Saved${savedCount > 0 ? ` (${savedCount})` : ""}` },
        ].map(t => (
          <button key={t.id} onClick={() => onTab(t.id)}
            style={{ padding: "6px 18px", borderRadius: 10, fontSize: 13, fontWeight: 500,
              cursor: "pointer", border: "none", fontFamily: "'DM Sans', sans-serif",
              background: tab === t.id ? C.borderLight : "transparent",
              color:      tab === t.id ? C.text        : C.textSoft,
              transition: "all 0.15s" }}>
            {t.label}
          </button>
        ))}
        <button
          onClick={onSignOut}
          style={{ marginLeft: 12, padding: "6px 14px", borderRadius: 10, fontSize: 13,
            fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            border: `1px solid ${C.border}`, background: "#fff", color: C.textMid,
            transition: "all 0.15s" }}>
          Sign out
        </button>
        <div style={{ marginLeft: 12, width: 32, height: 32, borderRadius: "50%",
          background: `linear-gradient(135deg, ${C.green}, #7BA88A)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          S
        </div>
      </nav>
    </header>
  );
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

function OnboardingScreen({ onComplete }) {
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState({
    distance: "30 min", age: "25–34", kidFriendly: false,
    childAge: null, vibes: [], comfort: "Moderate",
  });

  const fadeIn    = { animation: "fadeUp 0.35s ease both" };
  const heroEmoji = ["🗺️", "👥", "🏕️"][step];
  const heroLabel = ["Find your next adventure", "Tell us about yourself", "Pick your vibe"][step];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.parchment }}>
      {/* Left hero panel */}
      <div style={{ width: "38%", position: "relative", display: "flex", flexDirection: "column",
        justifyContent: "flex-end", padding: 48, overflow: "hidden",
        background: "linear-gradient(155deg, #065f46 0%, #0f172a 100%)", color: "#fff" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 120, opacity: 0.12, pointerEvents: "none" }}>
          {heroEmoji}
        </div>
        <TreeLine style={{ position: "absolute", bottom: 0, left: 0, opacity: 0.4 }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 42,
            fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>drift</div>
          <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 15,
            color: "rgba(167,243,208,0.85)", fontStyle: "italic", lineHeight: 1.6 }}>{heroLabel}</p>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column",
        padding: "56px 64px", overflow: "auto" }}>
        {/* Progress bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2,
              background: i <= step ? C.green : C.borderLight, transition: "background 0.3s" }} />
          ))}
          <span style={{ fontSize: 12, color: C.textSoft, whiteSpace: "nowrap" }}>{step + 1} of 3</span>
        </div>

        <div style={{ maxWidth: 480 }}>
          {/* ── Step 0 — Location ── */}
          {step === 0 && (
            <div key="s0" style={fadeIn}>
              <h2 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 28,
                color: C.text, marginBottom: 6 }}>Where are you?</h2>
              <p style={{ fontSize: 14, color: C.textSoft, marginBottom: 32 }}>
                We'll find experiences nearby and filter by how far you'll travel.
              </p>
              <SectionLabel>Your location</SectionLabel>
              <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10,
                  background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14,
                  padding: "14px 18px" }}>
                  <span style={{ color: C.green }}>●</span>
                  <span style={{ fontSize: 14, color: C.text }}>Madison, WI</span>
                  <span style={{ fontSize: 11, color: C.textSoft, background: C.tanLight,
                    padding: "2px 8px", borderRadius: 6, marginLeft: "auto" }}>detected</span>
                </div>
              </div>
              <SectionLabel>Max travel distance</SectionLabel>
              <ChipRow options={DISTANCES} selected={prefs.distance}
                onSelect={v => setPrefs(p => ({ ...p, distance: v }))} />
            </div>
          )}

          {/* ── Step 1 — About you ── */}
          {step === 1 && (
            <div key="s1" style={fadeIn}>
              <h2 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 28,
                color: C.text, marginBottom: 6 }}>About you</h2>
              <p style={{ fontSize: 14, color: C.textSoft, marginBottom: 32 }}>
                Helps us rank experiences that fit your life stage.
              </p>
              <SectionLabel>Age range</SectionLabel>
              <ChipRow options={AGES} selected={prefs.age}
                onSelect={v => setPrefs(p => ({ ...p, age: v }))} />

              <SectionLabel style={{ marginTop: 24 }}>Bringing kids?</SectionLabel>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "#fff", border: `1px solid ${C.border}`, borderRadius: 14,
                padding: "14px 18px", marginBottom: 12, cursor: "pointer" }}
                onClick={() => setPrefs(p => ({ ...p, kidFriendly: !p.kidFriendly }))}>
                <span style={{ fontSize: 14, color: C.text }}>Show kid-friendly experiences</span>
                <ToggleSwitch on={prefs.kidFriendly} />
              </div>

              {prefs.kidFriendly && (
                <div style={{ ...fadeIn, marginTop: 16 }}>
                  <SectionLabel>Youngest child's age</SectionLabel>
                  <ChipRow options={["Under 5", "5–12", "13–17"]} selected={prefs.childAge}
                    onSelect={v => setPrefs(p => ({ ...p, childAge: v }))} />
                </div>
              )}
            </div>
          )}

          {/* ── Step 2 — Preferences ── */}
          {step === 2 && (
            <div key="s2" style={fadeIn}>
              <h2 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 28,
                color: C.text, marginBottom: 6 }}>Your vibe</h2>
              <p style={{ fontSize: 14, color: C.textSoft, marginBottom: 32 }}>
                Pick up to 5 types. Skip if you want to see everything.
              </p>

              <SectionLabel>Activity types ({prefs.vibes.length}/5)</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 28 }}>
                {CATEGORIES.map(c => {
                  const active = prefs.vibes.includes(c.id);
                  return (
                    <button key={c.id}
                      onClick={() => setPrefs(p => ({
                        ...p,
                        vibes: active
                          ? p.vibes.filter(v => v !== c.id)
                          : p.vibes.length < 5 ? [...p.vibes, c.id] : p.vibes,
                      }))}
                      style={{ padding: "16px 8px", borderRadius: 14, fontSize: 13, fontWeight: 500,
                        fontFamily: "'DM Sans', sans-serif", textAlign: "center", cursor: "pointer",
                        background: active ? C.greenLight : "#fff",
                        color:      active ? C.green      : C.textMid,
                        border:     `1px solid ${active ? C.green : C.border}`,
                        transition: "all 0.15s", display: "flex", flexDirection: "column",
                        alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 22 }}>{c.icon}</span>{c.label}
                    </button>
                  );
                })}
              </div>

              <SectionLabel>Comfort level</SectionLabel>
              <div style={{ display: "flex", gap: 12 }}>
                {COMFORT.map(c => {
                  const active = prefs.comfort === c.label;
                  return (
                    <button key={c.label}
                      onClick={() => setPrefs(p => ({ ...p, comfort: c.label }))}
                      style={{ flex: 1, textAlign: "left", padding: 16, borderRadius: 14,
                        cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                        background: active ? C.greenLight : "#fff",
                        border:     `1px solid ${active ? C.green : C.border}`,
                        transition: "all 0.15s" }}>
                      <div style={{ fontWeight: 600, fontSize: 14,
                        color: active ? C.green : C.text, marginBottom: 4 }}>{c.label}</div>
                      <div style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.4 }}>{c.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Nav buttons */}
          <div style={{ display: "flex", gap: 12, marginTop: 36 }}>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                style={{ padding: "14px 28px", borderRadius: 14, border: `1px solid ${C.border}`,
                  background: "#fff", color: C.textMid, fontSize: 15, fontWeight: 500,
                  fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}>
                Back
              </button>
            )}
            {step === 2 && (
              <button onClick={() => onComplete(prefs)}
                style={{ padding: "14px 28px", borderRadius: 14, border: `1px solid ${C.border}`,
                  background: "#fff", color: C.textMid, fontSize: 15, fontWeight: 500,
                  fontFamily: "'DM Sans', sans-serif", cursor: "pointer" }}>
                Skip
              </button>
            )}
            <button onClick={() => step < 2 ? setStep(s => s + 1) : onComplete(prefs)}
              style={{ flex: 1, padding: "14px 24px", borderRadius: 14, border: "none",
                background: C.green, color: "#fff", fontSize: 15, fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif", cursor: "pointer", transition: "opacity 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              {step < 2 ? "Continue →" : "Start exploring →"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Detail View ──────────────────────────────────────────────────────────────

function DetailView({ experience, onBack, onSave, isSaved }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px" }}>
      <button onClick={onBack}
        style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24,
          background: "none", border: "none", cursor: "pointer", fontSize: 14,
          color: C.textSoft, fontFamily: "'DM Sans', sans-serif" }}>
        ← Back to Discover
      </button>

      <div style={{ display: "flex", gap: 40 }}>
        {/* Left — image + map */}
        <div style={{ width: "42%", flexShrink: 0 }}>
          <div style={{ borderRadius: 20, overflow: "hidden",
            boxShadow: "0 4px 24px rgba(61,107,78,0.12)", marginBottom: 12 }}>
            <CardImage experience={experience} style={{ height: 300 }} />
          </div>

          {/* Thumbnail strip */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ flex: 1, height: 60, borderRadius: 10, overflow: "hidden",
                outline: i === 0 ? `2px solid ${C.green}` : "2px solid transparent",
                outlineOffset: 2, cursor: "pointer" }}>
                <CardImage experience={{
                  ...experience,
                  images: [
                    experience.images[i],
                    experience.images[(i + 1) % 3],
                    experience.images[(i + 2) % 3],
                  ],
                }} />
              </div>
            ))}
          </div>

          {/* Map placeholder */}
          <div style={{ borderRadius: 16, background: C.borderLight, height: 160,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: 6, color: C.textSoft,
            border: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 28 }}>🗺️</span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{experience.location}</span>
            <span style={{ fontSize: 12 }}>{experience.distance} away</span>
          </div>
        </div>

        {/* Right — all details */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start",
            justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: C.textSoft,
              textTransform: "uppercase", letterSpacing: 1 }}>
              {experience.categoryLabel}
            </span>
            <ConditionBadge type={experience.conditionType} label={experience.condition} large />
          </div>

          <h1 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 28,
            fontWeight: 700, color: C.text, margin: "0 0 8px", lineHeight: 1.3 }}>
            {experience.title}
          </h1>
          <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 14,
            color: C.textMid, fontStyle: "italic", margin: "0 0 20px" }}>
            "{experience.hook}"
          </p>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
            <Tag bg={C.greenLight}  color={C.green}>{experience.difficulty}</Tag>
            <Tag bg={C.tanLight}    color={C.tan}>{experience.cost}</Tag>
            <Tag bg="#EDE8DC"       color="#6B6050">{experience.time}</Tag>
            <Tag bg={C.borderLight} color={C.textMid}>{experience.season}</Tag>
            {experience.kidFriendly && (
              <Tag bg={C.greenLight} color={C.green}>
                Kid-friendly {experience.minAge > 0 ? `(${experience.minAge}+)` : ""}
              </Tag>
            )}
          </div>

          <p style={{ fontSize: 14, color: C.text, lineHeight: 1.8, margin: "0 0 12px" }}>
            {experience.description}
          </p>
          <p style={{ fontSize: 14, color: C.text, lineHeight: 1.8, margin: "0 0 24px" }}>
            {experience.description2}
          </p>

          <SectionLabel>What to bring</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
            {experience.whatToBring.map(item => (
              <span key={item} style={{ padding: "8px 14px", borderRadius: 10,
                background: C.tanLight, fontSize: 13, color: C.textMid }}>
                {item}
              </span>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => onSave(experience.id)}
              style={{ flex: 1, padding: "14px", borderRadius: 14, border: "none",
                cursor: "pointer", fontSize: 15, fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
                background: isSaved ? C.greenLight : C.green,
                color:      isSaved ? C.green      : "#fff" }}>
              {isSaved ? "✓ Saved" : "Save to collection"}
            </button>
            <button style={{ padding: "14px 20px", borderRadius: 14,
              border: `1px solid ${C.border}`, background: "#fff",
              color: C.textMid, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
              cursor: "pointer" }}>
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Collections View ─────────────────────────────────────────────────────────

function CollectionsView({ savedIds, experiences, onViewDetail }) {
  const [activeCol, setActiveCol] = useState("saved");
  const saved = experiences.filter(e => savedIds.includes(e.id));

  const collections = [
    { id: "saved",  label: "Saved",       icon: "💚", items: saved },
    { id: "bucket", label: "Bucket List",  icon: "⭐", items: saved.slice(0, Math.ceil(saved.length / 2)) },
    { id: "summer", label: "Summer 2026",  icon: "☀️", items: [] },
    { id: "trips",  label: "Day Trips",    icon: "🚗", items: [] },
  ];

  const col   = collections.find(c => c.id === activeCol);
  const items = col?.items || [];

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
      {/* Sidebar */}
      <div style={{ width: 220, flexShrink: 0, borderRight: `1px solid ${C.borderLight}`,
        padding: "24px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.textSoft,
          textTransform: "uppercase", letterSpacing: 1.2,
          padding: "0 10px", marginBottom: 8 }}>
          Collections
        </div>

        {collections.map(c => (
          <button key={c.id} onClick={() => setActiveCol(c.id)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              width: "100%", padding: "10px 12px", borderRadius: 10, border: "none",
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              background: activeCol === c.id ? C.greenLight : "transparent",
              color:      activeCol === c.id ? C.green      : C.textMid,
              transition: "all 0.15s" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8,
              fontSize: 13, fontWeight: 500 }}>
              {c.icon} {c.label}
            </span>
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8,
              background: activeCol === c.id ? C.green      : C.borderLight,
              color:      activeCol === c.id ? "#fff"       : C.textSoft }}>
              {c.items.length}
            </span>
          </button>
        ))}

        <button style={{ marginTop: 8, padding: "10px 12px", borderRadius: 10,
          cursor: "pointer", fontSize: 13, color: C.textSoft, background: "none",
          border: "none", textAlign: "left", fontFamily: "'DM Sans', sans-serif",
          display: "flex", alignItems: "center", gap: 8 }}>
          + New collection
        </button>
      </div>

      {/* Main grid */}
      <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center",
          justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 24,
              color: C.text, margin: "0 0 4px" }}>
              {col?.icon} {col?.label}
            </h2>
            <p style={{ fontSize: 13, color: C.textSoft }}>
              {items.length} experience{items.length !== 1 ? "s" : ""} saved
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 40px", color: C.textSoft }}>
            <span style={{ fontSize: 40, display: "block", marginBottom: 14 }}>🌿</span>
            <p style={{ fontSize: 16, fontFamily: "'Libre Baskerville', serif" }}>
              Nothing saved yet
            </p>
            <p style={{ fontSize: 13, marginTop: 8 }}>Swipe right on experiences you love</p>
          </div>
        ) : (
          <div style={{ display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {items.map(exp => (
              <div key={exp.id} onClick={() => onViewDetail(exp)}
                style={{ borderRadius: 16, overflow: "hidden", background: "#fff",
                  border: `1px solid ${C.borderLight}`, cursor: "pointer",
                  transition: "all 0.15s", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform    = "translateY(-2px)";
                  e.currentTarget.style.boxShadow    = "0 6px 20px rgba(61,107,78,0.12)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform    = "none";
                  e.currentTarget.style.boxShadow    = "0 2px 8px rgba(0,0,0,0.04)";
                }}>
                <div style={{ height: 130, overflow: "hidden" }}>
                  <CardImage experience={exp} style={{ height: 130 }} />
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: 11, color: C.textSoft, marginBottom: 4 }}>
                    {exp.categoryLabel} · {exp.distance}
                  </div>
                  <h3 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 14,
                    fontWeight: 700, color: C.text, margin: "0 0 8px", lineHeight: 1.3 }}>
                    {exp.title}
                  </h3>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Tag bg={C.greenLight} color={C.green}>{exp.difficulty}</Tag>
                    <Tag bg={C.tanLight}   color={C.tan}>{exp.cost}</Tag>
                    <ConditionBadge type={exp.conditionType} label={exp.condition} />
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

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [session, setSession] = useState(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [screen, setScreen] = useState(() =>
    initialPersisted?.onboardingComplete ? "main" : "onboarding",
  );
  const [prefs, setPrefs] = useState(() => mergePrefs(initialPersisted?.prefs));
  const [tab, setTab] = useState("discover");
  const [savedIds, setSavedIds] = useState(() => initialPersisted?.savedIds ?? []);
  const [skippedIds, setSkippedIds] = useState(() => initialPersisted?.skippedIds ?? []);
  const [detailExp, setDetailExp] = useState(null);

  const removedFromDiscover = useMemo(
    () => [...new Set([...skippedIds, ...savedIds])],
    [skippedIds, savedIds],
  );

  const discoverDeck = useMemo(
    () => buildDiscoverDeck(EXPERIENCES, prefs, removedFromDiscover),
    [prefs, removedFromDiscover],
  );

  const prefsSummary = useMemo(() => formatPrefsSummary(prefs), [prefs]);

  const sessionReviewed = skippedIds.length + savedIds.length;

  const handleOnboardingComplete = useCallback((nextPrefs) => {
    setPrefs(mergePrefs(nextPrefs));
    setScreen("main");
  }, []);

  const handleSave = useCallback((id) => {
    setSavedIds((s) => (s.includes(id) ? s : [...s, id]));
  }, []);

  const handleSkip = useCallback((id) => {
    setSkippedIds((s) => (s.includes(id) ? s : [...s, id]));
  }, []);

  const handleDetail = useCallback((exp) => {
    setDetailExp(exp);
  }, []);

  const handleBack = useCallback(() => {
    setDetailExp(null);
  }, []);

  useEffect(() => {
    if (screen === "welcome") return;
    savePersistedState({
      onboardingComplete: screen === "main",
      prefs,
      savedIds,
      skippedIds,
    });
  }, [screen, prefs, savedIds, skippedIds]);

  // Load Google Fonts
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@400;500&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setAuthReady(true);
      setScreen(
        data.session
          ? initialPersisted?.onboardingComplete
            ? "main"
            : "onboarding"
          : "welcome",
      );
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession ?? null);
      setAuthBusy(false);
      setAuthReady(true);
      setScreen(
        nextSession
          ? initialPersisted?.onboardingComplete
            ? "main"
            : "onboarding"
          : "welcome",
      );
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setAuthBusy(true);
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
    } catch (error) {
      console.error("Google sign-in failed", error);
      setAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setScreen("welcome");
      setTab("discover");
      setDetailExp(null);
    } catch (error) {
      console.error("Sign out failed", error);
    }
  };

  if (!authReady) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: C.parchment, color: C.text, fontFamily: "'DM Sans', sans-serif" }}>
        Loading Drift...
      </div>
    );
  }

  if (!session) {
    return <WelcomeScreen onContinueWithGoogle={handleGoogleSignIn} authBusy={authBusy} />;
  }

  if (screen === "onboarding") {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column",
      background: C.parchment, fontFamily: "'DM Sans', sans-serif", overflow: "hidden" }}>
      <TopNav
        tab={tab}
        onTab={(t) => {
          setTab(t);
          setDetailExp(null);
        }}
        onSignOut={handleSignOut}
        savedCount={savedIds.length}
        maxTravelLabel={prefs.distance || DEFAULT_PREFS.distance}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column",
        overflow: "hidden", marginTop: 56 }}>
        {detailExp ? (
          <DetailView
            experience={detailExp}
            onBack={handleBack}
            onSave={handleSave}
            isSaved={savedIds.includes(detailExp.id)}
          />
        ) : tab === "discover" ? (
          <SwipeView
            experiences={discoverDeck}
            onViewDetail={handleDetail}
            onSave={handleSave}
            onSkip={handleSkip}
            prefsSummary={prefsSummary}
            sessionStats={{
              reviewed: sessionReviewed,
              remaining: discoverDeck.length,
            }}
          />
        ) : (
          <CollectionsView
            savedIds={savedIds}
            experiences={EXPERIENCES}
            onViewDetail={handleDetail}
          />
        )}
      </div>
    </div>
  );
}
