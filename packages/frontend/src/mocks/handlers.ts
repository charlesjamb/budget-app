import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/auth/me", () => {
    return HttpResponse.json({ error: "Not authenticated" }, { status: 401 });
  }),
];
