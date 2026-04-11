import { useState, useEffect, useMemo, useCallback } from "react";
import rawExperiencesMidwest from "./data/experiences.json";
import { normalizeExperiences } from "./data/normalizeExperiences.js";
import { SwipeView } from "./components/SwipeView.jsx";
import { WelcomeScreen } from "./components/WelcomeScreen.jsx";
import { TopNav } from "./components/TopNav.jsx";
import { OnboardingScreen } from "./components/OnboardingScreen.jsx";
import { DetailView } from "./components/DetailView.jsx";
import { CollectionsView } from "./components/CollectionsView.jsx";
import { CATEGORIES } from "./lib/appConstants.js";
import { buildDiscoverDeck, mergePrefs, DEFAULT_PREFS } from "./lib/discoverDeck.js";
import { loadPersistedState, savePersistedState } from "./lib/persistence.js";
import { supabase, hasSupabaseConfig } from "./supabase.js";
import { C } from "./theme/palette.js";

const EXPERIENCES = normalizeExperiences(rawExperiencesMidwest);

const initialPersisted =
  typeof window !== "undefined" ? loadPersistedState() : null;

function formatPrefsSummary(prefs) {
  const vibeLabels = (prefs.vibes || [])
    .map((id) => CATEGORIES.find((category) => category.id === id)?.label)
    .filter(Boolean);
  const vibesText = vibeLabels.length ? vibeLabels.join(" · ") : "All activities";
  const bits = [vibesText, `Within ${prefs.distance || "30 min"}`];
  if (prefs.kidFriendly) bits.push("Kid-friendly");
  return bits.join(" · ");
}

function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: C.parchment,
        color: C.text,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      Loading Drift...
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(() =>
    hasSupabaseConfig ? null : { user: { id: "local-guest" } },
  );
  const [authBusy, setAuthBusy] = useState(false);
  const [authReady, setAuthReady] = useState(() => !hasSupabaseConfig);
  const [screen, setScreen] = useState(() =>
    initialPersisted?.onboardingComplete ? "main" : "onboarding",
  );
  const [tab, setTab] = useState("discover");
  const [prefs, setPrefs] = useState(() => mergePrefs(initialPersisted?.prefs));
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
    setSavedIds((current) => (current.includes(id) ? current : [...current, id]));
  }, []);

  const handleSkip = useCallback((id) => {
    setSkippedIds((current) => (current.includes(id) ? current : [...current, id]));
  }, []);

  const handleDetail = useCallback((experience) => {
    setDetailExp(experience);
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

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@400;500&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      setAuthReady(true);
      setScreen(initialPersisted?.onboardingComplete ? "main" : "onboarding");
      return undefined;
    }

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
    if (!supabase) return;
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
    if (!supabase) return;
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
    return <LoadingScreen />;
  }

  if (hasSupabaseConfig && !session) {
    return <WelcomeScreen onContinueWithGoogle={handleGoogleSignIn} authBusy={authBusy} />;
  }

  if (screen === "onboarding") {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: C.parchment,
        fontFamily: "'DM Sans', sans-serif",
        overflow: "hidden",
      }}
    >
      <TopNav
        tab={tab}
        onTab={(nextTab) => {
          setTab(nextTab);
          setDetailExp(null);
        }}
        onSignOut={handleSignOut}
        showAuthActions={hasSupabaseConfig}
        savedCount={savedIds.length}
        maxTravelLabel={prefs.distance || DEFAULT_PREFS.distance}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", marginTop: 56 }}>
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
