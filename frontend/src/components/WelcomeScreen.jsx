import { C } from "../theme/palette.js";
import { Drifty } from "./Drifty.jsx";

const GoogleMark = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.215 36 24 36c-6.627 0-12-5.373-12-12S17.373 12 24 12c3.059 0 5.842 1.154 7.96 3.04l5.657-5.657C34.046 6.053 29.277 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917Z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.96 3.04l5.657-5.657C34.046 6.053 29.277 4 24 4c-7.682 0-14.347 4.337-17.694 10.691Z" />
    <path fill="#4CAF50" d="M24 44c5.176 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.144 35.091 26.683 36 24 36c-5.194 0-9.625-3.333-11.284-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44Z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.085 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917Z" />
  </svg>
);

const MountainBackdrop = () => (
  <svg viewBox="0 0 720 480" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.22 }}>
    <defs>
      <linearGradient id="peakGlow" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#D6FAE9" />
        <stop offset="100%" stopColor="#9AC6B4" />
      </linearGradient>
      <linearGradient id="lakeGlow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#BDE3D8" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#BDE3D8" stopOpacity="0.05" />
      </linearGradient>
    </defs>
    <circle cx="535" cy="116" r="58" fill="rgba(255,255,255,0.36)" />
    <path d="M0 330L120 224L183 280L287 145L380 250L462 176L566 264L632 216L720 282V480H0Z" fill="url(#peakGlow)" />
    <path d="M0 374L120 310L213 354L318 296L404 336L494 302L575 338L720 292V480H0Z" fill="rgba(255,255,255,0.2)" />
    <rect x="0" y="350" width="720" height="130" fill="url(#lakeGlow)" />
  </svg>
);

const FeaturePill = ({ children }) => (
  <span style={{ padding: "8px 14px", borderRadius: 999, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.14)", fontSize: 12, color: "rgba(255,255,255,0.88)", backdropFilter: "blur(6px)" }}>
    {children}
  </span>
);

const StatCard = ({ label, value, align = "left" }) => (
  <div style={{ minWidth: 170, padding: "16px 18px", borderRadius: 18, background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.18)", boxShadow: "0 14px 34px rgba(5, 24, 20, 0.18)", backdropFilter: "blur(12px)", textAlign: align }}>
    <div style={{ fontSize: 11, letterSpacing: 1.1, textTransform: "uppercase", color: "rgba(255,255,255,0.72)", marginBottom: 8 }}>
      {label}
    </div>
    <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 22, color: "#fff" }}>
      {value}
    </div>
  </div>
);

const EditorialNote = ({ title, body }) => (
  <div
    style={{
      padding: "16px 18px",
      borderRadius: 18,
      background: "rgba(255,255,255,0.12)",
      border: "1px solid rgba(255,255,255,0.14)",
      backdropFilter: "blur(10px)",
      maxWidth: 260,
    }}
  >
    <div style={{ fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,0.72)", marginBottom: 8 }}>
      {title}
    </div>
    <div style={{ fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,0.88)" }}>
      {body}
    </div>
  </div>
);

export function WelcomeScreen({ onContinueWithGoogle, authBusy }) {
  return (
    <div className="welcome-root" style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", background: "linear-gradient(135deg, #eef5f0 0%, #f7f4ec 52%, #faf9f6 100%)" }}>
      <section className="welcome-hero" style={{ position: "relative", overflow: "hidden", padding: "56px 52px 44px", background: "linear-gradient(160deg, #103c34 0%, #195045 44%, #274237 100%)", color: "#fff" }}>
        <MountainBackdrop />

        <div className="welcome-hero-inner" style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 48 }}>
            <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 34, letterSpacing: 0.6 }}>
              drift
            </div>
            <FeaturePill>Outdoor discovery, reimagined</FeaturePill>
          </div>

          <div style={{ maxWidth: 520, marginTop: 24 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 999, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.14)", marginBottom: 22, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,0.8)" }}>
              Today’s field guide
            </div>
            <h1 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 60, lineHeight: 1.02, letterSpacing: -1.2, margin: "0 0 18px" }}>
              Open the app and know what fits today.
            </h1>
            <p style={{ maxWidth: 460, margin: 0, fontSize: 17, lineHeight: 1.8, color: "rgba(235,247,241,0.82)" }}>
              Drift blends nearby outdoor experiences, your saved tastes, and live conditions into one calm, swipe-first dashboard that feels more like an editor’s shortlist than a search tool.
            </p>
          </div>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 28 }}>
            <FeaturePill>Weather-aware picks</FeaturePill>
            <FeaturePill>Save collections</FeaturePill>
            <FeaturePill>Fast onboarding</FeaturePill>
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 26 }}>
            <EditorialNote
              title="This morning"
              body="Scenic drives, lakeside walks, and wildlife stops are trending because the weather window is unusually calm."
            />
            <EditorialNote
              title="Why people stay"
              body="Collections, condition-aware picks, and quick swiping remove the usual planning drag from outdoor weekends."
            />
          </div>

          <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 18, flexWrap: "wrap" }}>
            <StatCard label="Perfect today" value="12 nearby ideas" />
            <StatCard label="Mood" value="Calm, warm, spontaneous" align="right" />
            <StatCard label="Best fit" value="Short scenic wins" align="right" />
          </div>
        </div>
      </section>

      <section className="welcome-auth" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 40px" }}>
        <div className="welcome-auth-panel" style={{ width: "100%", maxWidth: 430 }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: C.greenMid, marginBottom: 12 }}>
              Welcome Back
            </div>
            <h2 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 42, lineHeight: 1.12, color: C.text, margin: "0 0 14px" }}>
              Sign in and step straight into your shortlist.
            </h2>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.8, color: C.textSoft }}>
              Save swipes, build themed collections, and keep your outdoor dashboard synced across devices.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginBottom: 18, animation: "driftySlideIn 0.5s ease both" }}>
            <Drifty size={56} pose="wave" style={{ animation: "driftyBounce 2.4s ease-in-out infinite", flexShrink: 0 }} />
            <div
              style={{
                background: "#fff",
                color: C.green,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                padding: "10px 16px",
                borderRadius: 16,
                borderBottomLeftRadius: 4,
                boxShadow: "0 4px 16px rgba(61,107,78,0.1)",
                lineHeight: 1.5,
                animation: "driftyBubble 0.5s ease 0.3s both",
              }}
            >
              Hey! Sign in to save your adventures
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.78)", border: `1px solid ${C.borderLight}`, borderRadius: 30, padding: "28px 24px 24px", boxShadow: "0 22px 60px rgba(61,107,78,0.08)", backdropFilter: "blur(20px)" }}>

            <button
              onClick={onContinueWithGoogle}
              disabled={authBusy}
              style={{ width: "100%", minHeight: 64, display: "flex", alignItems: "center", justifyContent: "center", gap: 14, padding: "14px 22px", borderRadius: 999, border: `1.5px solid ${C.border}`, background: authBusy ? "#edf1ec" : "#fff", color: "#202124", fontSize: 16, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", cursor: authBusy ? "wait" : "pointer", boxShadow: authBusy ? "none" : "0 10px 24px rgba(61,107,78,0.08)", transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease" }}
              onMouseEnter={(e) => {
                if (!authBusy) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 16px 30px rgba(61,107,78,0.12)";
                  e.currentTarget.style.borderColor = C.greenMid;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = authBusy ? "none" : "0 10px 24px rgba(61,107,78,0.08)";
                e.currentTarget.style.borderColor = C.border;
              }}
            >
              <GoogleMark size={24} />
              <span>{authBusy ? "Connecting to Google..." : "Continue with Google"}</span>
            </button>

            <p style={{ margin: "16px 0 0", fontSize: 12, lineHeight: 1.7, color: C.textSoft, textAlign: "center" }}>
              Secure Google sign-in for your saved cards, collections, and future personalization.
            </p>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes driftyBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        @keyframes driftySlideIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes driftyBubble {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @media (max-width: 980px) {
          .welcome-root {
            grid-template-columns: 1fr !important;
          }

          .welcome-hero {
            min-height: 52vh;
            padding: 40px 28px 32px !important;
          }

          .welcome-hero-inner {
            gap: 16px;
          }

          .welcome-auth {
            padding: 28px 20px 40px !important;
          }
        }

        @media (max-width: 640px) {
          .welcome-auth-panel h2 {
            font-size: 34px !important;
          }

          .welcome-hero h1 {
            font-size: 44px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default WelcomeScreen;
