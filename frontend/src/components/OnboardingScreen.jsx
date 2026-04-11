import { useState } from "react";
import { C } from "../theme/palette.js";
import { SectionLabel } from "./ui.jsx";
import {
  CATEGORIES,
  DISTANCES,
  AGES,
  COMFORT,
  DEFAULT_LOCATION,
  LOCATION_OPTIONS,
} from "../lib/appConstants.js";

const TreeLine = ({ style }) => (
  <svg viewBox="0 0 400 60" style={{ width: "100%", height: 60, ...style }}>
    {[0, 30, 55, 80, 110, 140, 165, 195, 220, 250, 275, 305, 330, 360].map((x, i) => (
      <path
        key={i}
        d={`M${x + 15} 58 L${x + 15} 35 L${x + 5} 35 L${x + 15} 15 L${x + 8} 15 L${x + 15} 0 L${x + 22} 15 L${x + 15} 15 L${x + 25} 35 L${x + 15} 35Z`}
        fill={C.green}
        opacity={0.04 + (i % 3) * 0.02}
      />
    ))}
  </svg>
);

const ChipRow = ({ options, selected, onSelect }) => (
  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
    {options.map((option) => (
      <button
        key={option}
        onClick={() => onSelect(option)}
        style={{
          padding: "10px 20px",
          borderRadius: 24,
          fontSize: 13,
          fontWeight: 500,
          fontFamily: "'DM Sans', sans-serif",
          background: selected === option ? C.green : "#fff",
          color: selected === option ? "#fff" : C.textMid,
          border: `1px solid ${selected === option ? C.green : C.border}`,
          cursor: "pointer",
          transition: "all 0.15s",
        }}
      >
        {option}
      </button>
    ))}
  </div>
);

const ToggleSwitch = ({ on }) => (
  <div
    style={{
      width: 44,
      height: 24,
      borderRadius: 12,
      background: on ? C.green : C.borderLight,
      position: "relative",
      cursor: "pointer",
      transition: "background 0.2s",
      flexShrink: 0,
    }}
  >
    <div
      style={{
        width: 20,
        height: 20,
        borderRadius: 10,
        background: "#fff",
        position: "absolute",
        top: 2,
        left: on ? 22 : 2,
        transition: "left 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
      }}
    />
  </div>
);

export function OnboardingScreen({ onComplete }) {
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState({
    location: DEFAULT_LOCATION,
    distance: "30 min",
    age: "25–34",
    kidFriendly: false,
    childAge: null,
    vibes: [],
    comfort: "Moderate",
  });

  const fadeIn = { animation: "fadeUp 0.35s ease both" };
  const heroEmoji = ["🗺️", "👥", "🏕️"][step];
  const heroLabel = ["Find your next adventure", "Tell us about yourself", "Pick your vibe"][step];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.parchment }}>
      <div
        style={{
          width: "38%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 48,
          overflow: "hidden",
          background: "linear-gradient(155deg, #065f46 0%, #0f172a 100%)",
          color: "#fff",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 120,
            opacity: 0.12,
            pointerEvents: "none",
          }}
        >
          {heroEmoji}
        </div>
        <TreeLine style={{ position: "absolute", bottom: 0, left: 0, opacity: 0.4 }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              fontFamily: "'Libre Baskerville', serif",
              fontSize: 42,
              fontWeight: 700,
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            drift
          </div>
          <p
            style={{
              fontFamily: "'Libre Baskerville', serif",
              fontSize: 15,
              color: "rgba(167,243,208,0.85)",
              fontStyle: "italic",
              lineHeight: 1.6,
            }}
          >
            {heroLabel}
          </p>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "56px 64px", overflow: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                background: i <= step ? C.green : C.borderLight,
                transition: "background 0.3s",
              }}
            />
          ))}
          <span style={{ fontSize: 12, color: C.textSoft, whiteSpace: "nowrap" }}>{step + 1} of 3</span>
        </div>

        <div style={{ maxWidth: 480 }}>
          {step === 0 ? (
            <div key="s0" style={fadeIn}>
              <h2 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 28, color: C.text, marginBottom: 6 }}>
                Where are you?
              </h2>
              <p style={{ fontSize: 14, color: C.textSoft, marginBottom: 32 }}>
                We'll find experiences nearby and filter by how far you'll travel.
              </p>
              <SectionLabel>Your location</SectionLabel>
              <div
                style={{
                  marginBottom: 28,
                  background: "#fff",
                  border: `1px solid ${C.border}`,
                  borderRadius: 14,
                  padding: "14px 18px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ color: C.green }}>●</span>
                  <span style={{ fontSize: 14, color: C.text }}>Choose a seeded city from the current demo data</span>
                </div>
                <select
                  value={prefs.location}
                  onChange={(event) => setPrefs((current) => ({ ...current, location: event.target.value }))}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    background: C.parchment,
                    color: C.text,
                    fontSize: 14,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {LOCATION_OPTIONS.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>
              <SectionLabel>Max travel distance</SectionLabel>
              <ChipRow options={DISTANCES} selected={prefs.distance} onSelect={(value) => setPrefs((p) => ({ ...p, distance: value }))} />
            </div>
          ) : null}

          {step === 1 ? (
            <div key="s1" style={fadeIn}>
              <h2 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 28, color: C.text, marginBottom: 6 }}>
                About you
              </h2>
              <p style={{ fontSize: 14, color: C.textSoft, marginBottom: 32 }}>
                Helps us rank experiences that fit your life stage.
              </p>
              <SectionLabel>Age range</SectionLabel>
              <ChipRow options={AGES} selected={prefs.age} onSelect={(value) => setPrefs((p) => ({ ...p, age: value }))} />

              <SectionLabel style={{ marginTop: 24 }}>Bringing kids?</SectionLabel>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#fff",
                  border: `1px solid ${C.border}`,
                  borderRadius: 14,
                  padding: "14px 18px",
                  marginBottom: 12,
                  cursor: "pointer",
                }}
                onClick={() => setPrefs((p) => ({ ...p, kidFriendly: !p.kidFriendly }))}
              >
                <span style={{ fontSize: 14, color: C.text }}>Show kid-friendly experiences</span>
                <ToggleSwitch on={prefs.kidFriendly} />
              </div>

              {prefs.kidFriendly ? (
                <div style={{ ...fadeIn, marginTop: 16 }}>
                  <SectionLabel>Youngest child's age</SectionLabel>
                  <ChipRow
                    options={["Under 5", "5–12", "13–17"]}
                    selected={prefs.childAge}
                    onSelect={(value) => setPrefs((p) => ({ ...p, childAge: value }))}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div key="s2" style={fadeIn}>
              <h2 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 28, color: C.text, marginBottom: 6 }}>
                Your vibe
              </h2>
              <p style={{ fontSize: 14, color: C.textSoft, marginBottom: 32 }}>
                Pick up to 5 types. Skip if you want to see everything.
              </p>

              <SectionLabel>Activity types ({prefs.vibes.length}/5)</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 28 }}>
                {CATEGORIES.map((category) => {
                  const active = prefs.vibes.includes(category.id);
                  return (
                    <button
                      key={category.id}
                      onClick={() =>
                        setPrefs((p) => ({
                          ...p,
                          vibes: active
                            ? p.vibes.filter((value) => value !== category.id)
                            : p.vibes.length < 5
                              ? [...p.vibes, category.id]
                              : p.vibes,
                        }))
                      }
                      style={{
                        padding: "16px 8px",
                        borderRadius: 14,
                        fontSize: 13,
                        fontWeight: 500,
                        fontFamily: "'DM Sans', sans-serif",
                        textAlign: "center",
                        cursor: "pointer",
                        background: active ? C.greenLight : "#fff",
                        color: active ? C.green : C.textMid,
                        border: `1px solid ${active ? C.green : C.border}`,
                        transition: "all 0.15s",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span style={{ fontSize: 22 }}>{category.icon}</span>
                      {category.label}
                    </button>
                  );
                })}
              </div>

              <SectionLabel>Comfort level</SectionLabel>
              <div style={{ display: "flex", gap: 12 }}>
                {COMFORT.map((option) => {
                  const active = prefs.comfort === option.label;
                  return (
                    <button
                      key={option.label}
                      onClick={() => setPrefs((p) => ({ ...p, comfort: option.label }))}
                      style={{
                        flex: 1,
                        textAlign: "left",
                        padding: 16,
                        borderRadius: 14,
                        cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                        background: active ? C.greenLight : "#fff",
                        border: `1px solid ${active ? C.green : C.border}`,
                        transition: "all 0.15s",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 14,
                          color: active ? C.green : C.text,
                          marginBottom: 4,
                        }}
                      >
                        {option.label}
                      </div>
                      <div style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.4 }}>{option.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 12, marginTop: 36 }}>
            {step > 0 ? (
              <button
                onClick={() => setStep((value) => value - 1)}
                style={{
                  padding: "14px 28px",
                  borderRadius: 14,
                  border: `1px solid ${C.border}`,
                  background: "#fff",
                  color: C.textMid,
                  fontSize: 15,
                  fontWeight: 500,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: "pointer",
                }}
              >
                Back
              </button>
            ) : null}
            {step === 2 ? (
              <button
                onClick={() => onComplete(prefs)}
                style={{
                  padding: "14px 28px",
                  borderRadius: 14,
                  border: `1px solid ${C.border}`,
                  background: "#fff",
                  color: C.textMid,
                  fontSize: 15,
                  fontWeight: 500,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: "pointer",
                }}
              >
                Skip
              </button>
            ) : null}
            <button
              onClick={() => (step < 2 ? setStep((value) => value + 1) : onComplete(prefs))}
              style={{
                flex: 1,
                padding: "14px 24px",
                borderRadius: 14,
                border: "none",
                background: C.green,
                color: "#fff",
                fontSize: 15,
                fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif",
                cursor: "pointer",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.opacity = "0.88";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.opacity = "1";
              }}
            >
              {step < 2 ? "Continue →" : "Start exploring →"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default OnboardingScreen;
