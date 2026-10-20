import { useState } from "react";
import { getMonthRhythm } from "../lib/rhythm.js";

/** Plan/Close months for today, fixed for the lifetime of the component. */
export function useMonthRhythm() {
  const [rhythm] = useState(() => getMonthRhythm(new Date()));
  return rhythm;
}
