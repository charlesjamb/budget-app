import { addMonths } from "./month.js";

const PLAN_EMPHASIS_LAST_DAY = 7;

export interface MonthRhythm {
  /** Month whose budget and wires are being prepared. */
  planMonth: string;
  /** Month being wrapped up: import, classify, settle. */
  closeMonth: string;
  /** True during the first days of a month, when planning is the thing to do. */
  planEmphasised: boolean;
}

/**
 * Early in a month (days 1–7) we plan the current month and close the previous one;
 * later on we close the current month and get ready to plan the next.
 */
export function getMonthRhythm(date: Date): MonthRhythm {
  const current = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const planEmphasised = date.getDate() <= PLAN_EMPHASIS_LAST_DAY;

  return planEmphasised
    ? { planMonth: current, closeMonth: addMonths(current, -1), planEmphasised }
    : { planMonth: addMonths(current, 1), closeMonth: current, planEmphasised };
}
