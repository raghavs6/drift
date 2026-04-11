import { useState, useEffect, useMemo, useCallback } from "react";
import rawExperiencesMidwest from "./data/experiences.json";
import { normalizeExperiences } from "./data/normalizeExperiences.js";
import { SwipeView } from "./components/SwipeView.jsx";
import { WelcomeScreen } from "./components/WelcomeScreen.jsx";
import { TopNav } from "./components/TopNav.jsx";
import { OnboardingScreen } from "./components/OnboardingScreen.jsx";
import { DetailView } from "./components/DetailView.jsx";
import { CollectionsView } from "./components/CollectionsView.jsx";
import { CATEGORIES, DEFAULT_LOCATION, getLocationOptions } from "./lib/appConstants.js";
import { buildDiscoverDeck, mergePrefs, DEFAULT_PREFS } from "./lib/discoverDeck.js";
import { fetchExperiences } from "./lib/api.js";
import { loadPersistedState, savePersistedState } from "./lib/persistence.js";
import { supabase, hasSupabaseConfig } from "./supabase.js";
import { C } from "./theme/palette.js";

const SEEDED_EXPERIENCES = normalizeExperiences(rawExperiencesMidwest);

const initialPersisted =
  typeof window !== "undefined" ? loadPersistedState() : null;

const DEFAULT_COLLECTIONS = [
  { id: "saved", label: "Saved", icon: "💚", itemIds: [] },
  { id: "bucket", label: "Bucket List", icon: "⭐", itemIds: [] },
];

function sanitizeItemIds(ids) {
  return Array.isArray(ids) ? [...new Set(ids.filter(Boolean))] : [];
}

function normalizeCollections(rawCollections, legacySavedIds = []) {
  const legacySaved = sanitizeItemIds(legacySavedIds);
  const baseCollections = DEFAULT_COLLECTIONS.map((collection) => ({
    ...collection,
    itemIds: collection.id === "saved" ? legacySaved : [],
  }));

  if (!Array.isArray(rawCollections)) {
    return baseCollections;
  }

  const byId = new Map(baseCollections.map((collection) => [collection.id, collection]));

  rawCollections.forEach((collection) => {
    if (!collection || typeof collection !== "object" || !collection.id || !collection.label) {
      return;
    }

    const normalized = {
      id: collection.id,
      label: collection.label,
      icon: collection.icon || "🗂️",
      itemIds: sanitizeItemIds(collection.itemIds),
    };

    if (normalized.id === "saved") {
      normalized.icon = "💚";
      normalized.label = "Saved";
      normalized.itemIds = [...new Set([...legacySaved, ...normalized.itemIds])];
    } else if (normalized.id === "bucket") {
      normalized.icon = "⭐";
      normalized.label = "Bucket List";
    }

    byId.set(normalized.id, normalized);
  });

  return [
    byId.get("saved"),
    byId.get("bucket"),
    ...[...byId.values()].filter((collection) => !["saved", "bucket"].includes(collection.id)),
  ];
}

function makeCollectionId(name) {
  return `collection-${name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "custom"}-${Date.now()}`;
}

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
  const [experiences, setExperiences] = useState(SEEDED_EXPERIENCES);
  const [collections, setCollections] = useState(() =>
    normalizeCollections(initialPersisted?.collections, initialPersisted?.savedIds),
  );
  const [skippedIds, setSkippedIds] = useState(() => initialPersisted?.skippedIds ?? []);
  const [detailExp, setDetailExp] = useState(null);
  const [swipeCollectionId, setSwipeCollectionId] = useState("saved");

  const savedIds = useMemo(
    () => collections.find((collection) => collection.id === "saved")?.itemIds ?? [],
    [collections],
  );

  const locationOptions = useMemo(() => getLocationOptions(experiences), [experiences]);

  const removedFromDiscover = useMemo(
    () => [...new Set([...skippedIds, ...savedIds])],
    [skippedIds, savedIds],
  );

  const discoverDeck = useMemo(
    () => buildDiscoverDeck(experiences, prefs, removedFromDiscover),
    [experiences, prefs, removedFromDiscover],
  );

  const prefsSummary = useMemo(() => formatPrefsSummary(prefs), [prefs]);
  const sessionReviewed = skippedIds.length + savedIds.length;

  const handleOnboardingComplete = useCallback((nextPrefs) => {
    setPrefs(mergePrefs(nextPrefs));
    setScreen("main");
  }, []);

  const handleSave = useCallback((id) => {
    setCollections((current) =>
      current.map((collection) =>
        collection.id === "saved"
          ? {
              ...collection,
              itemIds: collection.itemIds.includes(id) ? collection.itemIds : [...collection.itemIds, id],
            }
          : collection,
      ),
    );
  }, []);

  const handleSkip = useCallback((id) => {
    setSkippedIds((current) => (current.includes(id) ? current : [...current, id]));
  }, []);

  const handleCreateCollection = useCallback((label) => {
    const trimmed = label.trim();
    if (!trimmed) return;

    setCollections((current) => {
      if (current.some((collection) => collection.label.toLowerCase() === trimmed.toLowerCase())) {
        return current;
      }

      return [
        ...current,
        {
          id: makeCollectionId(trimmed),
          label: trimmed,
          icon: "🗂️",
          itemIds: [],
        },
      ];
    });
  }, []);

  const handleAddToCollection = useCallback((collectionId, experienceId) => {
    setCollections((current) =>
      current.map((collection) =>
        collection.id === "saved"
          ? {
              ...collection,
              itemIds: collection.itemIds.includes(experienceId)
                ? collection.itemIds
                : [...collection.itemIds, experienceId],
            }
          : collection.id === collectionId
          ? {
              ...collection,
              itemIds: collection.itemIds.includes(experienceId)
                ? collection.itemIds
                : [...collection.itemIds, experienceId],
            }
          : collection,
      ),
    );
  }, []);

  const handleSwipeSave = useCallback((id) => {
    if (swipeCollectionId && swipeCollectionId !== "saved") {
      handleAddToCollection(swipeCollectionId, id);
      return;
    }
    handleSave(id);
  }, [handleAddToCollection, handleSave, swipeCollectionId]);

  const handleRemoveFromCollection = useCallback((collectionId, experienceId) => {
    setCollections((current) =>
      current
        .map((collection) => {
          if (collectionId === "saved") {
            return {
              ...collection,
              itemIds: collection.itemIds.filter((id) => id !== experienceId),
            };
          }

          if (collection.id !== collectionId) {
            return collection;
          }

          return {
            ...collection,
            itemIds: collection.itemIds.filter((id) => id !== experienceId),
          };
        }),
    );
  }, []);

  const handleDeleteCollection = useCallback((collectionId) => {
    if (["saved", "bucket"].includes(collectionId)) return;
    setCollections((current) => current.filter((collection) => collection.id !== collectionId));
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
      collections,
      savedIds,
      skippedIds,
    });
  }, [screen, prefs, collections, savedIds, skippedIds]);

  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@400;500&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchExperiences()
      .then((items) => {
        if (cancelled || !items.length) return;
        setExperiences(normalizeExperiences(items));
      })
      .catch(() => {
        /* keep seeded fallback until backend is ready */
      });

    return () => {
      cancelled = true;
    };
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
    return <OnboardingScreen onComplete={handleOnboardingComplete} locationOptions={locationOptions} />;
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
        locationLabel={prefs.location || DEFAULT_LOCATION}
        maxTravelLabel={prefs.distance || DEFAULT_PREFS.distance}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", marginTop: 56 }}>
        {detailExp ? (
          <DetailView
            experience={detailExp}
            onBack={handleBack}
            onSave={handleSave}
            onAddToCollection={handleAddToCollection}
            onRemoveFromCollection={handleRemoveFromCollection}
            isSaved={savedIds.includes(detailExp.id)}
            collections={collections}
          />
        ) : tab === "discover" ? (
          <SwipeView
            experiences={discoverDeck}
            onViewDetail={handleDetail}
            onSave={handleSwipeSave}
            onSkip={handleSkip}
            locationLabel={prefs.location || DEFAULT_LOCATION}
            prefsSummary={prefsSummary}
            collections={collections}
            swipeCollectionId={swipeCollectionId}
            onSwipeCollectionChange={setSwipeCollectionId}
            sessionStats={{
              reviewed: sessionReviewed,
              remaining: discoverDeck.length,
            }}
          />
        ) : (
          <CollectionsView
            collections={collections}
            experiences={experiences}
            onViewDetail={handleDetail}
            onCreateCollection={handleCreateCollection}
            onAddToCollection={handleAddToCollection}
            onRemoveFromCollection={handleRemoveFromCollection}
            onDeleteCollection={handleDeleteCollection}
          />
        )}
      </div>
    </div>
  );
}
