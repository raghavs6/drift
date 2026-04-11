import { C } from "../theme/palette.js";

export function TopNav({
  tab,
  onTab,
  onSignOut,
  showAuthActions = false,
  savedCount = 0,
  locationLabel = "Madison, WI",
  maxTravelLabel = "30 min",
}) {
  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        height: 56,
        background: "rgba(250,249,246,0.92)",
        backdropFilter: "blur(8px)",
        borderBottom: `1px solid ${C.borderLight}`,
        display: "flex",
        alignItems: "center",
        padding: "0 32px",
        gap: 24,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <span
        style={{
          fontFamily: "'Libre Baskerville', serif",
          fontSize: 22,
          fontWeight: 700,
          color: C.green,
        }}
      >
        drift
      </span>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 14px",
          borderRadius: 10,
          background: "#fff",
          border: `1px solid ${C.border}`,
          fontSize: 13,
          color: C.textMid,
        }}
      >
        <span style={{ color: C.green }}>●</span> {locationLabel} · {maxTravelLabel} max
      </div>

      <nav style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
        {[
          { id: "discover", label: "Discover" },
          { id: "saved", label: `Saved${savedCount > 0 ? ` (${savedCount})` : ""}` },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => onTab(item.id)}
            style={{
              padding: "6px 18px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              border: "none",
              fontFamily: "'DM Sans', sans-serif",
              background: tab === item.id ? C.borderLight : "transparent",
              color: tab === item.id ? C.text : C.textSoft,
              transition: "all 0.15s",
            }}
          >
            {item.label}
          </button>
        ))}
        {showAuthActions ? (
          <button
            onClick={onSignOut}
            style={{
              marginLeft: 12,
              padding: "6px 14px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              border: `1px solid ${C.border}`,
              background: "#fff",
              color: C.textMid,
              transition: "all 0.15s",
            }}
          >
            Sign out
          </button>
        ) : null}
        <div
          style={{
            marginLeft: 12,
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.green}, #7BA88A)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          S
        </div>
      </nav>
    </header>
  );
}

export default TopNav;
