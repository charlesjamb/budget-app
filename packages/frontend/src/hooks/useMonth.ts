import { useCallback } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { getCurrentMonth } from "../lib/month.js";

/** Selected month, stored in the `?month=YYYY-MM` search param shared by all authenticated routes. */
export function useMonth() {
  const { month: monthParam } = useSearch({ from: "/_authenticated" });
  const navigate = useNavigate();

  const month = monthParam ?? getCurrentMonth();

  const setMonth = useCallback(
    (next: string) => {
      void navigate({ to: ".", search: (prev) => ({ ...prev, month: next }) });
    },
    [navigate],
  );

  return [month, setMonth] as const;
}
