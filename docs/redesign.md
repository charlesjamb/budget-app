# Redesign

Design decisions from the October 2026 design review. Product behaviour is specified in `SPEC.md`; this document covers look, structure and UX only. Mockups use real February 2026 data.

## Problems with the current design

1. **Flat hierarchy** — the purple gradient sidebar is the loudest element on screen; nine nav items share equal weight although usage rhythms differ (daily vs. monthly vs. setup).
2. **Dashboard** — one full-width card per category; ~15 numbers need scrolling. Yellow bar means both "exactly on budget" and "almost there". "1 transactions".
3. **Transactions** — right-aligned labels, Exclude/Reimburse repeated on every row, no search, latin1 characters broken (`CHEQUE N�`).
4. **Mobile** — 8-item bottom bar overlapping content, wrapped amounts (`125.00 / €`), horizontally scrolling table.
5. **Budget** — 21 rows of `0.00 € [0.00]`, always-visible disabled Save.
6. **History** — table of green numbers, no chart; green means "has a value".
7. **Split** — people identified by email; settlement shown as an ambiguous signed amount.
8. **Accessibility** — month arrows have no accessible name; low-contrast grey on lavender.
9. **Login** — reports "Invalid email or password" when the API is unreachable.

## 1. Direction

**Warm & personal, data-first.** This is a private app for Charles & Mathilde: warmth is welcome (names, category emoji, soft palette), but colour moves out of the chrome and into the data. Numbers are the hero.

- Off-white / cream background, neutral sidebar (no gradient), one soft accent
- Status colours reserved for data: neutral/green under budget, amber ≥ 90 %, red over
- Full light + dark palettes as theme tokens
- Category emoji everywhere a category appears
- Display names ("Charles", "Mathilde") instead of emails

## 2. Navigation

Structure follows the real monthly rhythm. Budgeting happens at the **start** of the month; importing and settling at the **end**.

```
┌──────────────────┐
│ ◐ Mathilde & C.  │
│                  │
│ Overview         │
│ Transactions     │
│ History          │
│                  │
│ PLAN · Nov       │   ← emphasised during the first days of the month
│ ① Budget         │
│ ② Wires          │
│                  │
│ CLOSE · Oct      │
│ ① Import         │
│ ② Classify   ●3  │   ← badge: unclassified count
│ ③ Settle up      │
│ ─────────        │
│ Categories       │
│ Settings         │
└──────────────────┘
```

- The current Split page is split in two: **Wires** (`/plan/wires`, start of month) and **Settle up** (`/close/settle`, end of month). Same data, shorter pages.
- **Mobile:** 4 tabs — `Overview · Transactions · Month · ☰`. "Month" opens the currently relevant flow (Plan or Close) as a stepper, with a switch to the other. ☰ opens a sheet with History, Categories, Settings, Logout. No "More" overflow.

## 3. Dashboard

```
February 2026                                         ‹  ›
Hi Charles & Mathilde

  272 € left                    ┌ Unbudgeted ───────┐
  of 3 211 € · 2 939 € spent    │ 150 € · Santé,    │
  ━━━━━━━━━━━━━━━━━━━━━━━━━━░░  │ Vacances  → Budget│
                                └───────────────────┘
NEEDS ATTENTION
  🏠 Logement        1 607 / 1 434   +173 € over   ━━━━━━━━━━▌
  🧾 Taxe foncière     326 /   126   +200 € over   ━━━━━━━━━━▌
  👶 Lulu               71 /    52    +19 € over   ━━━━━━━━━━▌

VARIABLE                                     649 / 937
  🥖 Nourriture   421 / 500   79 left   ━━━━━━━━━━━━━━━━━░░░  19
  🍷 Sortie        81 / 200  119 left   ━━━━━━━░░░░░░░░░░░░░   3
  📈 Investiss.    70 / 125   55 left   ━━━━━━━━━░░░░░░░░░░░   2
  🐶 Haiku         26 /  60   34 left   ━━━━━━━━░░░░░░░░░░░░   1

FIXED   5 of 5 paid ✓ · 312 €                          [ show ▾ ]
```

- Hero: **€ left** with a single progress bar. No pace/"today" marker (rejected).
- **Needs attention**: over-budget categories from any group float to the top.
- Compact rows inside one card per group; all categories fit on one screen. Transaction count is a small trailing number.
- Fixed expenses that land exactly on budget are "paid ✓", not a warning.
- **Fixed group collapsed by default** into a summary line.
- Unbudgeted spending is a callout linking to Budget, not fake rows.
- Requires a new `icon` (emoji) field on budget categories.

## 4. Transactions

```
Transactions · February 2026                               ‹  ›
┌──────────────────────────────────────────────────────────────┐
│ 🔍 Search merchant…     [All ▾] [🥖 Nourriture ×]  45 · 2 939 €│
└──────────────────────────────────────────────────────────────┘
 MON 16 FEB                                               −87 €
   Les Tilleuls            🥖 Nourriture              −3.10 €
   Pharmacie des Tilleuls  💊 Santé                   −4.18 €
   Les Petites Culottes    👶 Lulu                   −52.25 €
   Cotisations bancaires   🏦 Frais bancaire         −20.00 €
   Cotisations bancaires   🏦 Frais bancaire         −12.15 €  excluded
                                                 hover → [⋯]
 SAT 14 FEB                                               −23 €
   Cerise et Potiron       🥖 Nourriture             −22.51 €
```

- One grouped list for desktop and mobile (no table, no sorting — not needed).
- Day headers with daily totals; merchant left-aligned in title case, or merchant alias when defined.
- Category chip is clickable for inline recategorisation.
- Exclude / Reimburse / Recategorise live in a `⋯` menu (hover on desktop, tap on mobile).
- Excluded rows dimmed with a tag instead of strikethrough.
- Search + category filter; count and total reflect the filter.
- Fix CSV decoding at import (latin1 read as UTF-8).

## 5. Budget (Plan ①)

```
Plan · March 2026                                          ‹  ›
① Budget  ─────  ② Wires

  3 211 € planned · +196 € vs February        [ Start from February ]

VARIABLE                                    937 €
                    Feb budget  Feb spent    March
  🥖 Nourriture         500        421     [ 500 ] ✓
  🍷 Sortie             200         81     [ 150 ] ↓50
  👶 Lulu                52         71 ⚠   [  75 ] ↑23
  💊 Santé                –         51     [  50 ] new
FIXED                                     2 274 €
  🏠 Logement         1 434      1 607 ⚠   [1 607] ↑173

                                              Next: Wires →
```

- Previous month's **budget and actual spend** shown as context, ⚠ where overspent.
- **Pre-fill only on click** ("Start from February"), never automatic.
- **Save on blur**, per row (existing `PUT /budget` accepts a single item), with a brief ✓ confirmation. No Save button.
- Total planned and **delta vs. previous month always visible** in the header.
- Per-row deltas: ↑ / ↓ / new.

## 6. History

```
History                              [ 6 months ▾ ]  Jan 2026 – Jun 2026
                                                 ── spent  ┄┄ budget
 3.5k ┤                ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄
 3.0k ┤        ███      ███
 2.0k ┤        ███      ███
    0 ┼──███───███──────███────
        Jan    Feb      Mar      ← click a month → its Dashboard

BY CATEGORY                 Jan    Feb    Mar   avg   trend
  🥖 Nourriture              14    421    …     218   ▁▇▅
  🏠 Logement                 –  1 607    …     804   ▁█▇
```

- Monthly total bars with the budget as a dashed line; months are clickable.
- Category table keeps numbers, adds average and sparkline; cells tinted red when over that month's budget.
- Range presets 3 / 6 / 12 months replace the native month inputs.
- Chart is a small hand-built SVG component — no chart library.

## 7. Smaller pages

**Wires (Plan ②)** and **Settle up (Close ③)** — logic unchanged (`ratio = revenue / Σ revenue`, `wire = budgeted × ratio`, `settlement = (spent − budgeted) × ratio`):

```
WIRES                                   SETTLE UP
Revenue                                 February: spent 2 939 € of 3 211 €
  Charles   [ 3 200 € ]  57%            ┌───────────────────────────────┐
  Mathilde  [ 2 400 € ]  43%            │  272 € left in the joint acct │
To wire for March (3 211 €)             │  → Charles gets back 155.16 € │
  Charles   ➜ 1 830.27 €                │  → Mathilde gets back 117.05 €│
  Mathilde  ➜ 1 380.73 €                └───────────────────────────────┘
```

- Settlement worded as "gets back X €" (negative difference) / "owes X €" (positive).
- Rounding remainder assigned to the last member so shares sum exactly to the total.
- No revenue entered → "Enter your incomes to compute wires", with an option to carry over last month's incomes.

**Import (Close ①)** — drop zone + file button; result summary: "45 imported · 3 duplicates skipped · 3 to classify → Classify".

**Classify (Close ②)** — restyle only, logic kept: one card at a time, suggested categories first, "Remember for this merchant" checkbox, progress `1 / 3`.

**Categories** — rows with emoji, name, type, `⋯`; click a row to edit inline (emoji, name, type); "+ New category" row at the bottom. No per-row Edit buttons.

**Settings** — new Profile section (display name, email); Appearance; Mapping rules (searchable, `⋯` actions); Merchant aliases.

**Login** — cream background, "Mathilde & Charles" wordmark, no gradient. Distinguish "Can't reach the server" from invalid credentials.

**Accessibility** — `aria-label`s on month arrows and icon buttons; contrast checked on both palettes.

## Data changes

- `users.display_name` (set to Charles / Mathilde)
- `budget_categories.icon` (emoji, nullable)
- Second user's login email `constance@budget.app` → `mathilde@budget.app`
- Count of unclassified transactions for the Classify badge (reuse existing classify data if possible)

## Rollout

One commit per phase; `vp check` + `pnpm test` and an app screenshot review after each.

| Phase | Scope                                                                                                                                                                                                    |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0     | Foundations: theme tokens (warm light/dark palette, type scale, spacing), shared primitives (Card, Row, Chip, Amount, MonthPicker with aria-labels), DB migration (`display_name`, `icon`, email change) |
| 1     | Navigation shell (grouped sidebar, mobile 4 tabs, Classify badge); route split `/split` → `/plan/wires` + `/close/settle`                                                                                |
| 2     | Dashboard                                                                                                                                                                                                |
| 3     | Transactions + latin1 import fix                                                                                                                                                                         |
| 4     | Budget                                                                                                                                                                                                   |
| 5     | History                                                                                                                                                                                                  |
| 6     | Wires, Settle up, Import, Classify, Categories, Settings, Login                                                                                                                                          |
