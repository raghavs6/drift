/**
 * Regression test for the collection-removal data-loss bug in App.jsx.
 *
 * `handleRemoveFromCollection` used to check the `collectionId` *argument* inside
 * the `.map` callback instead of the `collection.id` being mapped over. Because the
 * argument never changes between iterations, removing a single item from "Saved"
 * stripped that item out of every other collection too — silently destroying any
 * curation the user had done on Bucket List and custom boards.
 */
import { describe, expect, it } from "vitest";
import { removeItemFromCollection } from "./App.jsx";

const EXPERIENCE_ID = "devils-lake-kayak";
const OTHER_ID = "picnic-point-walk";

function makeCollections() {
  return [
    { id: "saved", label: "Saved", icon: "💚", itemIds: [EXPERIENCE_ID, OTHER_ID] },
    { id: "bucket", label: "Bucket List", icon: "⭐", itemIds: [EXPERIENCE_ID] },
    { id: "collection-summer-1", label: "Summer", icon: "🗂️", itemIds: [EXPERIENCE_ID, OTHER_ID] },
  ];
}

describe("removeItemFromCollection", () => {
  it("removing from Saved leaves the item in every other collection", () => {
    const result = removeItemFromCollection(makeCollections(), "saved", EXPERIENCE_ID);

    expect(result.find((c) => c.id === "saved").itemIds).toEqual([OTHER_ID]);
    // The bug: these two used to come back empty of EXPERIENCE_ID as well.
    expect(result.find((c) => c.id === "bucket").itemIds).toEqual([EXPERIENCE_ID]);
    expect(result.find((c) => c.id === "collection-summer-1").itemIds).toEqual([
      EXPERIENCE_ID,
      OTHER_ID,
    ]);
  });

  it("removing from a custom collection leaves Saved and Bucket List alone", () => {
    const result = removeItemFromCollection(
      makeCollections(),
      "collection-summer-1",
      EXPERIENCE_ID,
    );

    expect(result.find((c) => c.id === "collection-summer-1").itemIds).toEqual([OTHER_ID]);
    expect(result.find((c) => c.id === "saved").itemIds).toEqual([EXPERIENCE_ID, OTHER_ID]);
    expect(result.find((c) => c.id === "bucket").itemIds).toEqual([EXPERIENCE_ID]);
  });

  it("leaves every collection untouched when the id is not in the target", () => {
    const before = makeCollections();
    const result = removeItemFromCollection(before, "bucket", "never-saved-this");

    expect(result).toEqual(before);
  });

  it("ignores an unknown collection id", () => {
    const before = makeCollections();
    const result = removeItemFromCollection(before, "no-such-collection", EXPERIENCE_ID);

    expect(result).toEqual(before);
  });
});
