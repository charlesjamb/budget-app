import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/split")({
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/plan/wires", search: { month: search.month } });
  },
});
