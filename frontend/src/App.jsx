import { useState, useEffect, useRef, useCallback } from "react";

// ─── Google Fonts ─────────────────────────────────────────────────────────────
// Libre Baskerville (serif headings) + DM Sans (body) — loaded in root useEffect

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  green:       "#3D6B4E",
  greenLight:  "#E8F0E5",
  greenMid:    "#7BA88A",
  tan:         "#8B7E6A",
  tanLight:    "#F5F0E6",
  parchment:   "#FAF9F6",
  border:      "#D6D1C4",
  borderLight: "#E8E3D9",
  text:        "#3D3629",
  textMid:     "#5A5446",
  textSoft:    "#8B7E6A",
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const EXPERIENCES = [
  {
    id: "devils-lake-kayak",
    title: "Sunrise kayaking on Devil's Lake",
    hook: "Glass-calm water, bluff reflections, and zero crowds before 7am",
    location: "Baraboo, WI",
    distance: "45 min",
    difficulty: "Easy",
    cost: "$15 rental",
    time: "2–3 hrs",
    season: "May – Sep",
    category: "water",
    categoryLabel: "Water",
    kidFriendly: true,
    minAge: 6,
    conditionScore: 0.95,
    description: "Launch from the north shore before dawn and paddle into one of Wisconsin's most dramatic landscapes. The 360-foot quartzite bluffs catch the first light and mirror perfectly in the still water. Rentals available at the park concession starting at 6am on weekends.",
    description2: "Bring a dry bag for your phone — you'll want photos of the bluff reflections. The lake is nestled between two bluffs over 500 feet high, unlike any other flatwater paddling in the region.",
    whatToBring: ["Sunscreen", "Water shoes", "Dry bag", "Layers for morning chill"],
    images: ["#2D5A3E", "#1D4A2E", "#4A8B6B"],
  },
  {
    id: "ice-age-trail",
    title: "Ice Age Trail — Table Bluff segment",
    hook: "Ridge-top views of the Wisconsin River valley stretching to the horizon",
    location: "Cross Plains, WI",
    distance: "25 min",
    difficulty: "Moderate",
    cost: "Free",
    time: "3–4 hrs",
    season: "Year-round",
    category: "hiking",
    categoryLabel: "Hiking",
    kidFriendly: true,
    minAge: 8,
    conditionScore: 0.88,
    description: "This 5.2-mile segment of the Ice Age National Scenic Trail winds along a glacial ridge with panoramic views of the Wisconsin River valley. The trail passes through oak savanna and prairie remnants.",
    description2: "Spring wildflowers and fall colors are exceptional. The terrain is rolling with a few steep sections near Table Bluff itself. Download the offline map before you go.",
    whatToBring: ["Hiking boots", "Water bottle", "Trail snacks", "Bug spray"],
    images: ["#5A8F6E", "#3D6B4E", "#8BB89A"],
  },
  {
    id: "picnic-point",
    title: "Picnic Point sunset walk",
    hook: "A mile-long peninsula reaching into Lake Mendota — Madison's best golden hour",
    location: "Madison, WI",
    distance: "5 min",
    difficulty: "Easy",
    cost: "Free",
    time: "1–2 hrs",
    season: "Year-round",
    category: "hiking",
    categoryLabel: "Hiking",
    kidFriendly: true,
    minAge: 0,
    conditionScore: 0.92,
    description: "Walk the gravel path along this narrow peninsula jutting into Lake Mendota for unobstructed sunset views over the water. Fire pits are available first-come-first-served if you want to linger after dark.",
    description2: "The restored prairie on either side blooms with wildflowers from June through September. Accessible from the Lakeshore Nature Preserve parking lot.",
    whatToBring: ["Camera", "Blanket", "Firewood (if staying late)", "Mosquito repellent"],
    images: ["#C4A882", "#8B7E6A", "#D6C9A8"],
  },
  {
    id: "blue-mound-stargazing",
    title: "Blue Mound night sky viewing",
    hook: "The highest point in southern Wisconsin — dark skies, zero light pollution",
    location: "Blue Mounds, WI",
    distance: "40 min",
    difficulty: "Easy",
    cost: "$8 park pass",
    time: "2–3 hrs",
    season: "Apr – Oct",
    category: "stargazing",
    categoryLabel: "Stargazing",
    kidFriendly: true,
    minAge: 5,
    conditionScore: 0.70,
    description: "At 1,719 feet, Blue Mound State Park offers some of the darkest skies within an hour of Madison. The observation towers on the east and west ends provide 360-degree views.",
    description2: "The local astronomy club hosts public viewing nights with telescopes on clear weekends from April through October. Best during new moon phases.",
    whatToBring: ["Red flashlight", "Warm layers", "Star chart app", "Camp chair"],
    images: ["#1a2744", "#0d1b33", "#2a3d5c"],
  },
  {
    id: "governor-dodge-scramble",
    title: "Governor Dodge rock scramble",
    hook: "Sandstone ledges, hidden caves, and scrambles that feel like the desert Southwest",
    location: "Dodgeville, WI",
    distance: "50 min",
    difficulty: "Hard",
    cost: "$8 park pass",
    time: "3–5 hrs",
    season: "Apr – Nov",
    category: "climbing",
    categoryLabel: "Climbing",
    kidFriendly: false,
    minAge: 14,
    conditionScore: 0.82,
    description: "The sandstone bluffs around Stephens Falls offer surprisingly rugged scrambling terrain — ledges, overhangs, and small caves that feel more like Utah than Wisconsin.",
    description2: "The loop trail past Twin Valley Lake connects several scramble zones. Wear sturdy boots and expect to use your hands. Not for beginners or young children.",
    whatToBring: ["Sturdy boots", "Gloves", "Helmet (optional)", "First aid kit"],
    images: ["#8B6B4E", "#6B4E3A", "#A88B6B"],
  },
  {
    id: "pheasant-branch",
    title: "Pheasant Branch bird walk",
    hook: "200+ species spotted here — warblers, herons, and the occasional bald eagle",
    location: "Middleton, WI",
    distance: "15 min",
    difficulty: "Easy",
    cost: "Free",
    time: "1–2 hrs",
    season: "Year-round",
    category: "wildlife",
    categoryLabel: "Wildlife",
    kidFriendly: true,
    minAge: 0,
    conditionScore: 0.90,
    description: "This 546-acre conservancy is one of the best birding spots in Dane County. The spring creek, prairie, and marsh habitats attract over 200 species year-round.",
    description2: "Early morning visits in May during warbler migration are legendary. The boardwalk through the marsh is stroller-accessible. Free guided walks on Saturday mornings.",
    whatToBring: ["Binoculars", "Bird field guide", "Camera with zoom", "Quiet shoes"],
    images: ["#6B8F5E", "#4A6B3E", "#8BB87A"],
  },
  {
    id: "lake-mendota-sup",
    title: "Stand-up paddleboarding on Lake Mendota",
    hook: "Paddle past the terrace, the union, and the capitol dome from the water",
    location: "Madison, WI",
    distance: "10 min",
    difficulty: "Easy",
    cost: "$20 rental",
    time: "1–2 hrs",
    season: "Jun – Sep",
    category: "water",
    categoryLabel: "Water",
    kidFriendly: true,
    minAge: 10,
    conditionScore: 0.85,
    description: "Rent a board from the Memorial Union terrace and paddle along the UW-Madison shoreline for a completely different perspective of campus.",
    description2: "On calm days you can see the capitol dome reflecting in the water. Morning sessions before 10am offer the flattest water. Life jackets included with rental.",
    whatToBring: ["Swimsuit", "Sunscreen", "Waterproof phone case", "Water bottle"],
    images: ["#3D6B8E", "#2D5A7E", "#5A8FAE"],
  },
  {
    id: "dells-kayak-narrows",
    title: "Kayak the Narrows at Wisconsin Dells",
    hook: "Towering sandstone corridors so narrow you can touch both walls",
    location: "Wisconsin Dells, WI",
    distance: "55 min",
    difficulty: "Moderate",
    cost: "$25 guided",
    time: "3–4 hrs",
    season: "May – Sep",
    category: "water",
    categoryLabel: "Water",
    kidFriendly: true,
    minAge: 8,
    conditionScore: 0.78,
    description: "Skip the tourist traps and see the real Dells from a kayak. The guided tour takes you through narrow sandstone canyons where the rock walls tower 50+ feet on either side, close enough to touch.",
    description2: "You'll paddle past formations that took millions of years to carve. Morning tours are smaller groups and cooler temperatures. Book at least a week in advance in summer.",
    whatToBring: ["Water shoes", "Quick-dry clothing", "Waterproof camera", "Snacks"],
    images: ["#7E6B4E", "#5E4E3A", "#9E8B6E"],
  },
];

// Derive condition label + type from conditionScore
EXPERIENCES.forEach(e => {
  if (e.conditionScore > 0.85) { e.condition = "Perfect right now"; e.conditionType = "perfect"; }
  else if (e.conditionScore > 0.70) { e.condition = "Great this week";   e.conditionType = "great"; }
  else                              { e.condition = "Check conditions";  e.conditionType = "check"; }
});

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

const CardImage = ({ experience, style }) => {
  const [c1, c2, c3] = experience.images;
  return (
    <svg viewBox="0 0 400 260" style={{ width: "100%", display: "block", borderRadius: "inherit", ...style }}
      preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="260" fill={c1} />
      <circle cx="340" cy="50" r="30" fill={c2} opacity="0.3" />
      <path d="M0 260 L80 100 L120 155 L180 65 L240 135 L300 80 L360 115 L400 70 L400 260Z" fill={c2} />
      <path d="M0 260 L60 175 L120 200 L180 155 L240 182 L300 164 L360 178 L400 160 L400 260Z" fill={c3} opacity="0.6" />
      <rect width="400" height="260" fill="url(#cg)" />
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.35" stopColor="transparent" />
          <stop offset="1"    stopColor="rgba(0,0,0,0.6)" />
        </linearGradient>
      </defs>
    </svg>
  );
};

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

const SectionLabel = ({ children, style }) => (
  <div style={{ fontSize: 11, fontWeight: 500, color: C.textSoft, textTransform: "uppercase",
    letterSpacing: 1.2, marginBottom: 10, ...style }}>{children}</div>
);

const Tag = ({ children, bg, color }) => (
  <span style={{ padding: "5px 12px", borderRadius: 16, fontSize: 11, fontWeight: 500, background: bg, color }}>
    {children}
  </span>
);

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

const ConditionBadge = ({ type, label, large }) => {
  const map = {
    perfect: { bg: "#E8F0E5", color: "#3D6B4E", dot: "#3D6B4E" },
    great:   { bg: "#E0EEF7", color: "#2D6A8E", dot: "#3A8DBF" },
    check:   { bg: "#FFF3E0", color: "#A06020", dot: "#E08030" },
  };
  const s   = map[type] || map.check;
  const pad = large ? "8px 16px" : "4px 10px";
  const fs  = large ? 13 : 11;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: pad,
      borderRadius: 20, background: s.bg, color: s.color, fontSize: fs, fontWeight: 500 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {label}
    </span>
  );
};

const SwipeButton = ({ icon, borderColor, onClick, size = 52, fontSize = 22 }) => (
  <button onClick={onClick}
    style={{ width: size, height: size, borderRadius: "50%", border: `2px solid ${borderColor}`,
      background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      fontSize, cursor: "pointer", transition: "transform 0.1s", color: borderColor }}
    onMouseDown={e => e.currentTarget.style.transform = "scale(0.9)"}
    onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}>
    {icon}
  </button>
);

// ─── Top Navigation ───────────────────────────────────────────────────────────

function TopNav({ tab, onTab, savedCount = 0 }) {
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
        <span style={{ color: C.green }}>●</span> Madison, WI · 30 min
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

// ─── Swipe / Discover View ────────────────────────────────────────────────────

function SwipeView({ experiences, onViewDetail, onSave, onSkip }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDir, setSwipeDir]         = useState(null);
  const [dragX, setDragX]               = useState(0);
  const [isDragging, setIsDragging]     = useState(false);
  const startX = useRef(0);

  const current      = experiences[currentIndex];
  const next         = experiences[currentIndex + 1];
  const after        = experiences[currentIndex + 2];
  const perfectCount = experiences.filter(e => e.conditionScore > 0.85).length;

  const handleSwipe = useCallback((dir) => {
    setSwipeDir(dir);
    if (dir === "right") onSave(current.id);
    else onSkip(current.id);
    setTimeout(() => { setCurrentIndex(i => i + 1); setSwipeDir(null); setDragX(0); }, 280);
  }, [current, onSave, onSkip]);

  const onPointerDown = (e) => { startX.current = e.clientX; setIsDragging(true); };
  const onPointerMove = (e) => { if (isDragging) setDragX(e.clientX - startX.current); };
  const onPointerUp   = () => {
    setIsDragging(false);
    if (Math.abs(dragX) > 100) handleSwipe(dragX > 0 ? "right" : "left");
    else setDragX(0);
  };

  if (!current) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 14, padding: 60 }}>
        <span style={{ fontSize: 48 }}>🌿</span>
        <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 20,
          color: C.green, textAlign: "center" }}>You've explored everything nearby!</p>
        <p style={{ fontSize: 14, color: C.textSoft, textAlign: "center" }}>
          Check back tomorrow for new conditions.
        </p>
      </div>
    );
  }

  const rotation      = dragX * 0.04;
  const cardTransform = swipeDir
    ? `translateX(${swipeDir === "right" ? 700 : -700}px) rotate(${swipeDir === "right" ? 16 : -16}deg)`
    : `translateX(${dragX}px) rotate(${rotation}deg)`;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Condition banner */}
      <div style={{ background: C.greenLight, padding: "8px 32px", display: "flex",
        alignItems: "center", gap: 8, fontSize: 13, color: C.green, fontWeight: 500,
        borderBottom: `1px solid ${C.borderLight}`, flexShrink: 0 }}>
        ☀ {perfectCount} experiences are <strong>perfect</strong> for right now near Madison · 68°F, clear
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left sidebar — conditions */}
        <div style={{ width: 240, flexShrink: 0, padding: "24px 20px",
          borderRight: `1px solid ${C.borderLight}`,
          display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 18,
            border: `1px solid ${C.borderLight}` }}>
            <SectionLabel>Today's Conditions</SectionLabel>
            {[
              { label: "Temp",      value: "68°F" },
              { label: "Wind",      value: "8 mph" },
              { label: "Sky",       value: "Clear" },
              { label: "Golden hr", value: "7:42pm" },
            ].map((r, i, arr) => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between",
                fontSize: 13, paddingBottom: 8, marginBottom: 8,
                borderBottom: i < arr.length - 1 ? `1px solid ${C.borderLight}` : "none" }}>
                <span style={{ color: C.textSoft }}>{r.label}</span>
                <span style={{ fontWeight: 500, color: C.text }}>{r.value}</span>
              </div>
            ))}
          </div>

          <div style={{ background: "#fff", borderRadius: 16, padding: 18,
            border: `1px solid ${C.borderLight}` }}>
            <SectionLabel>This Session</SectionLabel>
            {[
              { label: "Swiped", value: currentIndex },
              { label: "Left",   value: Math.max(0, experiences.length - currentIndex) },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between",
                fontSize: 13, marginBottom: 8 }}>
                <span style={{ color: C.textSoft }}>{r.label}</span>
                <span style={{ fontWeight: 500, color: C.green }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Center — card stack + buttons */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", padding: "24px 40px", overflow: "hidden" }}>
          <div style={{ position: "relative", width: 380 }}>
            {/* Peeking background cards */}
            {after && <div style={{ position: "absolute", inset: "12px 12px 0", borderRadius: 20,
              background: "#fff", border: `1px solid ${C.borderLight}`, zIndex: 1 }} />}
            {next  && <div style={{ position: "absolute", inset: "6px 6px 0", borderRadius: 20,
              background: "#fff", border: `1px solid ${C.border}`, zIndex: 2 }} />}

            {/* Active draggable card */}
            <div style={{ position: "relative", zIndex: 3, borderRadius: 20, background: "#fff",
              border: `1px solid ${C.border}`, overflow: "hidden", cursor: "grab", userSelect: "none",
              transform: cardTransform,
              transition: swipeDir ? "transform 0.28s ease" : isDragging ? "none" : "transform 0.18s ease",
              boxShadow: "0 8px 32px rgba(61,107,78,0.12)" }}
              onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
              onPointerLeave={() => { if (isDragging) { setIsDragging(false); setDragX(0); } }}>

              {/* SAVE / SKIP overlay */}
              {Math.abs(dragX) > 30 && (
                <div style={{ position: "absolute", top: 20, zIndex: 10,
                  padding: "8px 20px", borderRadius: 8, fontWeight: 700, fontSize: 17, letterSpacing: 2,
                  ...(dragX > 0
                    ? { left: 20,  border: `3px solid ${C.green}`, color: C.green,  transform: "rotate(-15deg)" }
                    : { right: 20, border: "3px solid #C4A882",    color: "#C4A882", transform: "rotate(15deg)" }) }}>
                  {dragX > 0 ? "SAVE" : "SKIP"}
                </div>
              )}

              {/* Card image with overlaid title */}
              <div style={{ position: "relative" }}>
                <CardImage experience={current} />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0,
                  padding: "44px 20px 16px",
                  background: "linear-gradient(transparent, rgba(0,0,0,0.6))" }}>
                  <h2 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 19,
                    fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.3 }}>
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

              {/* Card body */}
              <div style={{ padding: "16px 20px 20px" }}>
                <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 13,
                  color: C.textMid, lineHeight: 1.6, fontStyle: "italic", margin: "0 0 14px" }}>
                  "{current.hook}"
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                  <Tag bg={C.greenLight} color={C.green}>{current.difficulty}</Tag>
                  <Tag bg={C.tanLight}   color={C.tan}>{current.cost}</Tag>
                  <Tag bg="#EDE8DC"      color="#6B6050">{current.time}</Tag>
                  {current.kidFriendly && <Tag bg={C.greenLight} color={C.green}>Kid-friendly</Tag>}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: C.textSoft }}>{current.season}</span>
                  <button onClick={(e) => { e.stopPropagation(); onViewDetail(current); }}
                    style={{ fontSize: 12, color: C.green, background: "none", border: "none",
                      cursor: "pointer", textDecoration: "underline",
                      fontFamily: "'DM Sans', sans-serif" }}>
                    View details →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Swipe action buttons */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center",
            gap: 20, marginTop: 24 }}>
            <SwipeButton icon="✕" borderColor="#C4A882" onClick={() => handleSwipe("left")} />
            <SwipeButton icon="▲" borderColor={C.greenMid} size={44} fontSize={16}
              onClick={() => onViewDetail(current)} />
            <SwipeButton icon="♥" borderColor={C.green} onClick={() => handleSwipe("right")} />
          </div>
          <p style={{ fontSize: 11, color: C.textSoft, marginTop: 10, letterSpacing: 0.5 }}>
            drag · or click · drag right to save
          </p>
        </div>

        {/* Right sidebar — up next */}
        <div style={{ width: 240, flexShrink: 0, padding: "24px 20px",
          borderLeft: `1px solid ${C.borderLight}`, overflowY: "auto" }}>
          <SectionLabel>Up Next</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {experiences.slice(currentIndex + 1, currentIndex + 5).map(exp => (
              <div key={exp.id}
                style={{ display: "flex", gap: 10, alignItems: "center",
                  padding: "10px 12px", borderRadius: 12, background: "#fff",
                  border: `1px solid ${C.borderLight}`, cursor: "pointer" }}
                onClick={() => onViewDetail(exp)}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.greenMid}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.borderLight}>
                <div style={{ width: 36, height: 36, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
                  <CardImage experience={exp} style={{ width: 36, height: 36 }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
  const [screen,     setScreen]     = useState("onboarding"); // "onboarding" | "main"
  const [tab,        setTab]        = useState("discover");   // "discover" | "saved"
  const [savedIds,   setSavedIds]   = useState([]);
  const [skippedIds, setSkippedIds] = useState([]);
  const [detailExp,  setDetailExp]  = useState(null);

  // Experiences not yet actioned in the swipe view
  const filteredExperiences = EXPERIENCES.filter(e => !skippedIds.includes(e.id));

  const handleSave   = (id)  => setSavedIds(s   => s.includes(id)  ? s : [...s, id]);
  const handleSkip   = (id)  => setSkippedIds(s => s.includes(id)  ? s : [...s, id]);
  const handleDetail = (exp) => setDetailExp(exp);
  const handleBack   = ()    => setDetailExp(null);

  // Load Google Fonts
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@400;500&display=swap";
    link.rel  = "stylesheet";
    document.head.appendChild(link);
  }, []);

  if (screen === "onboarding") {
    return <OnboardingScreen onComplete={() => setScreen("main")} />;
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column",
      background: C.parchment, fontFamily: "'DM Sans', sans-serif", overflow: "hidden" }}>
      <TopNav tab={tab} onTab={(t) => { setTab(t); setDetailExp(null); }} savedCount={savedIds.length} />

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
            experiences={filteredExperiences}
            onViewDetail={handleDetail}
            onSave={handleSave}
            onSkip={handleSkip}
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
