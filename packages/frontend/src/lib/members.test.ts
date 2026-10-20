import { describe, it, expect } from "vite-plus/test";
import { memberName, settlementVerb } from "./members.js";

describe("memberName", () => {
  it("prefers the display name and falls back to the email", () => {
    expect(memberName({ displayName: "Charles", email: "c@x.io" })).toBe("Charles");
    expect(memberName({ displayName: null, email: "c@x.io" })).toBe("c@x.io");
    expect(memberName({ displayName: "  ", email: "c@x.io" })).toBe("c@x.io");
  });
});

describe("settlementVerb", () => {
  it("maps the sign of the difference", () => {
    expect(settlementVerb(-100)).toBe("gets back");
    expect(settlementVerb(100)).toBe("owes");
    expect(settlementVerb(0)).toBeNull();
  });
});
