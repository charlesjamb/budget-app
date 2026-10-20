/** Name shown for a household member: display name when set, otherwise the email. */
export function memberName(member: { displayName?: string | null; email: string }): string {
  return member.displayName?.trim() || member.email;
}

/** "gets back X" for a negative settlement (left in the joint account), "owes X" for a positive one. */
export function settlementVerb(cents: number): "gets back" | "owes" | null {
  return cents < 0 ? "gets back" : cents > 0 ? "owes" : null;
}
