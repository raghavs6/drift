export function CardImage({ experience, style }) {
  const [c1, c2, c3] = experience.images;
  return (
    <svg
      viewBox="0 0 400 260"
      style={{ width: "100%", display: "block", borderRadius: "inherit", ...style }}
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="400" height="260" fill={c1} />
      <circle cx="340" cy="50" r="30" fill={c2} opacity="0.3" />
      <path
        d="M0 260 L80 100 L120 155 L180 65 L240 135 L300 80 L360 115 L400 70 L400 260Z"
        fill={c2}
      />
      <path
        d="M0 260 L60 175 L120 200 L180 155 L240 182 L300 164 L360 178 L400 160 L400 260Z"
        fill={c3}
        opacity="0.6"
      />
      <rect width="400" height="260" fill="url(#cg)" />
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.35" stopColor="transparent" />
          <stop offset="1" stopColor="rgba(0,0,0,0.6)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
