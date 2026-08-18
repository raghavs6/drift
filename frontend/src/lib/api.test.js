/**
 * Locks the explicit catalog limit on fetchExperiences.
 *
 * Without a `limit` param the backend serves its default of 100 rows, which
 * silently truncated the catalog: anything past row 100 could never be ranked,
 * and saved items outside that window vanished from Collections because
 * CollectionsView filters out ids it cannot resolve.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchExperiences } from "./api.js";

describe("fetchExperiences", () => {
  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [] }) }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requests an explicit limit rather than relying on the server default", async () => {
    await fetchExperiences();

    const url = new URL(global.fetch.mock.calls[0][0]);
    expect(url.pathname).toBe("/api/experiences");
    expect(Number(url.searchParams.get("limit"))).toBeGreaterThan(100);
  });

  it("stays within the server's maximum of 500", async () => {
    await fetchExperiences();

    const url = new URL(global.fetch.mock.calls[0][0]);
    expect(Number(url.searchParams.get("limit"))).toBeLessThanOrEqual(500);
  });
});
