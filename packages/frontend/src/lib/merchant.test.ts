import { describe, it, expect } from "vite-plus/test";
import { toTitleCase } from "./merchant.js";

describe("toTitleCase", () => {
  it("title-cases an upper-case bank label", () => {
    expect(toTitleCase("LES TILLEULS")).toBe("Les Tilleuls");
  });

  it("handles hyphens, apostrophes and accents", () => {
    expect(toTitleCase("PHARMACIE DE L'ÉGLISE")).toBe("Pharmacie De L'Église");
    expect(toTitleCase("CERISE-ET-POTIRON")).toBe("Cerise-Et-Potiron");
  });

  it("lowercases the rest of mixed-case labels", () => {
    expect(toTitleCase("dr HOARAU sc")).toBe("Dr Hoarau Sc");
  });
});
