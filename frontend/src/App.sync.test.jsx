/**
 * Regression tests for the backend sync effects in App.jsx.
 *
 * Two bugs these lock down:
 *  1. A failed initial load used to unlock the write effects, which then pushed the
 *     stale localStorage cache over the user's real server data.
 *  2. A successful initial load used to echo the freshly-fetched data straight back
 *     to the server as two pointless writes.
 */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./supabase.js", () => ({
  hasSupabaseConfig: true,
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
    },
  },
  default: null,
}));

vi.mock("./lib/api.js", () => ({
  fetchExperiences: vi.fn(),
  getPreferences: vi.fn(),
  putPreferences: vi.fn(),
  getSwipes: vi.fn(),
  recordSwipe: vi.fn(),
  getCollections: vi.fn(),
  putCollections: vi.fn(),
  planTrip: vi.fn(),
}));

vi.mock("./lib/weather.js", () => ({ fetchWeatherForLocation: vi.fn() }));

vi.mock("./lib/persistence.js", () => ({
  loadPersistedState: vi.fn(),
  savePersistedState: vi.fn(),
}));

import App from "./App.jsx";
import * as api from "./lib/api.js";
import { loadPersistedState } from "./lib/persistence.js";
import { supabase } from "./supabase.js";
import { fetchWeatherForLocation } from "./lib/weather.js";

const ACCESS_TOKEN = "test-token";
const SESSION = { access_token: ACCESS_TOKEN, user: { id: "user-123" } };

const EXPERIENCE_ID = "test-park";
const EXPERIENCE = { id: EXPERIENCE_ID, title: "Test Park", location: "Madison, WI" };

// Deliberately distinctive so a wrongful push of the local cache is unmistakable.
const LOCAL_CACHE = {
  onboardingComplete: true,
  prefs: { location: "Madison, WI", vibes: ["stale-local-vibe"] },
  collections: [
    { id: "saved", label: "Saved", icon: "💚", itemIds: ["stale-local-item"] },
  ],
  savedIds: ["stale-local-item"],
  skippedIds: [],
};

const SERVER_PREFS = {
  location: "Madison, WI",
  distance: "30 min",
  age: "25–34",
  comfort: "Moderate",
  kidFriendly: false,
  childAge: null,
  vibes: ["hiking"],
  onboardingComplete: true,
};

const SERVER_COLLECTIONS = {
  collections: [
    { id: "saved", label: "Saved", icon: "💚", itemIds: [] },
    { id: "bucket", label: "Bucket List", icon: "⭐", itemIds: [] },
  ],
};

/** The save control renders only its icon; "Save" is a sibling span, not a label. */
function findSaveButton() {
  return screen.findByText("♥");
}

function mockSuccessfulLoad() {
  api.getPreferences.mockResolvedValue(SERVER_PREFS);
  api.getCollections.mockResolvedValue(SERVER_COLLECTIONS);
  api.getSwipes.mockResolvedValue({ skippedIds: [] });
}

describe("App backend sync", () => {
  beforeEach(() => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: SESSION } });
    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    api.fetchExperiences.mockResolvedValue([EXPERIENCE]);
    api.putPreferences.mockResolvedValue({});
    api.putCollections.mockResolvedValue({ status: "ok" });
    api.recordSwipe.mockResolvedValue({ status: "ok" });

    fetchWeatherForLocation.mockResolvedValue({
      temperature: "70",
      wind: "5",
      sky: "Clear",
      summary: "Clear skies",
      sunset: "8:00 PM",
      updatedAt: null,
    });

    loadPersistedState.mockReturnValue(LOCAL_CACHE);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("never writes to the server when the initial load fails", async () => {
    const failure = new Error("network down");
    api.getPreferences.mockRejectedValue(failure);
    api.getCollections.mockRejectedValue(failure);
    api.getSwipes.mockRejectedValue(failure);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<App />);
    // The app still comes up, backed by the local cache.
    await findSaveButton();

    expect(api.putPreferences).not.toHaveBeenCalled();
    expect(api.putCollections).not.toHaveBeenCalled();
    expect(loadPersistedState).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it("writes nothing back after a successful load", async () => {
    mockSuccessfulLoad();

    render(<App />);
    await findSaveButton();

    expect(api.putPreferences).not.toHaveBeenCalled();
    expect(api.putCollections).not.toHaveBeenCalled();
  });

  it("still syncs changes made after a successful load", async () => {
    mockSuccessfulLoad();

    render(<App />);
    const saveButton = await findSaveButton();

    fireEvent.click(saveButton);

    await waitFor(() => expect(api.putCollections).toHaveBeenCalledTimes(1));
    expect(api.recordSwipe).toHaveBeenCalledWith(ACCESS_TOKEN, EXPERIENCE_ID, "save");
  });
});
