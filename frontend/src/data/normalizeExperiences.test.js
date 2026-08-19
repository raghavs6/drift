import { describe, it, expect } from "vitest";
import { normalizeExperience } from "./normalizeExperiences.js";

// Real shapes from the RIDB and NPS feeds — RIDB ships full HTML, NPS ships plain text.
const RIDB_HTML =
  '<p>Rice Draw Trail #1071 traverses multiple closed roads as it climbs from the ' +
  'valley bottom near the town of Heron to a major ridgeline.  The trail receives ' +
  'very little use.</p><p><a href="http://example.com" rel="nofollow">Rice Draw #1071</a></p>';

describe("normalizeExperience text cleanup", () => {
  it("renders HTML descriptions as prose", () => {
    const { description } = normalizeExperience({ title: "Rice Draw", description: RIDB_HTML });

    expect(description).not.toMatch(/<[a-z/]/i);
    expect(description).toContain("major ridgeline. The trail receives");
    expect(description).toContain("Rice Draw #1071");
  });

  it("cuts the hook to one sentence", () => {
    const { hook } = normalizeExperience({ title: "Rice Draw", description: RIDB_HTML });

    expect(hook).toBe(
      "Rice Draw Trail #1071 traverses multiple closed roads as it climbs from the " +
        "valley bottom near the town of Heron to a major ridgeline.",
    );
  });

  it("cuts long single sentences on a word boundary", () => {
    const { hook } = normalizeExperience({ title: "Long", description: `${"word ".repeat(60)}end.` });

    expect(hook.length).toBeLessThanOrEqual(141);
    expect(hook).toMatch(/word…$/);
  });

  it("does not split on an abbreviation", () => {
    const { hook } = normalizeExperience({
      title: "Priest",
      description: "J. Percy Priest Dam and Lake was one of the first Corps of Engineers lakes.",
    });

    expect(hook).toBe("J. Percy Priest Dam and Lake was one of the first Corps of Engineers lakes.");
  });

  it("drops a leading section heading from the hook", () => {
    const { hook, description } = normalizeExperience({
      title: "Anderson Road",
      description: "<h2>Overview</h2><p>Anderson Road Day Use has a swim beach and grills.</p>",
    });

    expect(hook).toBe("Anderson Road Day Use has a swim beach and grills.");
    // The full description keeps the heading as a light section marker.
    expect(description).toBe("Overview Anderson Road Day Use has a swim beach and grills.");
  });

  it("decodes entities", () => {
    const { description } = normalizeExperience({
      title: "Entities",
      description: "<p>Hikers &amp; bikers &#8212; it&#39;s open.</p>",
    });

    expect(description).toBe("Hikers & bikers — it's open.");
  });
});
