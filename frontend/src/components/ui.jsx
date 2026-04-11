import { C } from "../theme/palette.js";

export function SectionLabel({ children, style }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 500,
        color: C.textSoft,
        textTransform: "uppercase",
        letterSpacing: 1.2,
        marginBottom: 10,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Tag({ children, bg, color }) {
  return (
    <span
      style={{
        padding: "5px 12px",
        borderRadius: 16,
        fontSize: 11,
        fontWeight: 500,
        background: bg,
        color,
      }}
    >
      {children}
    </span>
  );
}

export function ConditionBadge({ type, label, large }) {
  const map = {
    perfect: { bg: "#E8F0E5", color: "#3D6B4E", dot: "#3D6B4E" },
    great:   { bg: "#E0EEF7", color: "#2D6A8E", dot: "#3A8DBF" },
    check:   { bg: "#FFF3E0", color: "#A06020", dot: "#E08030" },
  };
  const s = map[type] || map.check;
  const pad = large ? "8px 16px" : "4px 10px";
  const fs = large ? 13 : 11;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: pad,
        borderRadius: 20,
        background: s.bg,
        color: s.color,
        fontSize: fs,
        fontWeight: 500,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: s.dot,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}
