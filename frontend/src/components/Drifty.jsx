import { C } from "../theme/palette.js";

function Hand({ side = "right", wave = false }) {
  const isRight = side === "right";
  return (
    <g transform={isRight ? "translate(118 54)" : "translate(20 62)"}>
      <path
        d={isRight ? "M0 18 C6 8, 16 0, 28 0 C34 0, 38 4, 38 10 C38 14, 36 18, 34 22 C30 30, 20 34, 10 32 C4 30, 0 25, 0 18 Z" : "M32 18 C26 8, 16 0, 4 0 C-2 0,-6 4,-6 10 C-6 14,-4 18,-2 22 C2 30,12 34,22 32 C28 30,32 25,32 18 Z"}
        fill="#F7F3E7"
        stroke={C.green}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {wave ? (
        <g stroke={C.greenMid} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9">
          <path d="M44 -8 Q50 -14 56 -8" />
          <path d="M38 -18 Q45 -24 52 -18" />
          <path d="M52 -18 Q58 -24 64 -18" />
        </g>
      ) : null}
    </g>
  );
}

function Clipboard() {
  return (
    <g transform="translate(86 92) rotate(4)">
      <rect x="0" y="0" width="32" height="40" rx="6" fill="#F7F3E7" stroke={C.greenMid} strokeWidth="3" />
      <rect x="9" y="-6" width="14" height="10" rx="4" fill="#C7D5C8" stroke={C.greenMid} strokeWidth="3" />
      <path d="M8 14 l5 5 l8 -10" stroke={C.greenMid} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 26 l5 5 l8 -10" stroke={C.greenMid} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

function Sparkles() {
  return (
    <g fill={C.greenMid} opacity="0.9">
      <path d="M123 32 l4 8 l8 4 l-8 4 l-4 8 l-4 -8 l-8 -4 l8 -4z" />
      <path d="M138 18 l3 6 l6 3 l-6 3 l-3 6 l-3 -6 l-6 -3 l6 -3z" />
    </g>
  );
}

export function Drifty({ size = 84, pose = "wave", style }) {
  return (
    <div style={{ width: size, height: size, ...style }}>
      <svg viewBox="0 0 160 160" width="100%" height="100%" aria-hidden="true">
        <ellipse cx="80" cy="142" rx="46" ry="10" fill="rgba(61,107,78,0.14)" />
        <path
          d="M52 26 C56 14, 70 6, 86 8 C102 10, 114 20, 118 34 C126 40, 132 54, 132 72 C132 112, 106 138, 80 138 C54 138, 28 112, 28 72 C28 56, 34 42, 44 34 C44 28, 46 24, 52 26 Z"
          fill={C.green}
        />
        <path
          d="M54 34 C62 20, 84 14, 102 22 C95 18, 90 12, 86 8 C70 6, 56 14, 52 26 C46 24, 44 28, 44 34 C46 32, 50 32, 54 34 Z"
          fill="#547A60"
        />
        <ellipse cx="80" cy="64" rx="34" ry="25" fill="#F7F3E7" />
        <circle cx="66" cy="60" r="5.2" fill="#446A52" />
        <circle cx="94" cy="60" r="5.2" fill="#446A52" />
        <path d="M69 73 Q80 82 91 73" stroke="#446A52" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M56 128 C54 118, 60 112, 70 112 L70 138 L58 138 C54 138, 52 134, 56 128 Z" fill="#F7F3E7" stroke={C.green} strokeWidth="3" />
        <path d="M104 128 C106 118, 100 112, 90 112 L90 138 L102 138 C106 138, 108 134, 104 128 Z" fill="#F7F3E7" stroke={C.green} strokeWidth="3" />
        <path d="M42 84 C40 72, 42 62, 48 56 C54 50, 58 54, 58 62 L56 96 C52 98, 46 94, 42 84 Z" fill={C.green} />
        <path d="M118 84 C120 72, 118 62, 112 56 C106 50, 102 54, 102 62 L104 96 C108 98, 114 94, 118 84 Z" fill={C.green} />
        {pose === "wave" ? <Hand side="right" wave /> : null}
        {pose === "clipboard" ? <Clipboard /> : null}
        {pose === "sparkle" ? <Sparkles /> : null}
      </svg>
    </div>
  );
}

export default Drifty;
