import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/auth/me", () => {
    return HttpResponse.json({ error: "Not authenticated" }, { status: 401 });
  }),
  // Queried by the NavBar for the Classify badge on every authenticated page.
  http.get("/api/transactions/uncategorized-subcategories", () => {
    return HttpResponse.json({ subcategories: [] });
  }),
  // Queried by Classify (suggested categories) and Settings.
  http.get("/api/mapping-rules", () => {
    return HttpResponse.json({ rules: [] });
  }),
];
