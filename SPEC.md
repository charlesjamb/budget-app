# Budget Tracker — MVP Spec

## Problem

A couple defines a monthly budget by category in a spreadsheet. Their bank transactions don't map cleanly to their categories, making it hard to track actual spending. They can export transactions as CSV from their bank.

## Core Concepts

- **Transaction**: a single expense imported from the bank CSV
- **Budget Category**: user-defined categories (food, going out, dog, gas, investments, housing, health...)
- **Mapping Rule**: bank sub-category → budget category (e.g. "Hyper/supermarche" → Food)
- **Merchant Alias**: optional display rename (e.g. "SARL CHEVALLIER" → "Boulangerie Chevallier")

---

## Features

### 1. Budget Categories Management

- Create / edit / delete custom budget categories
- Each category has a name (optionally a color later)

### 2. CSV Import

- Upload bank CSV (semicolon-separated, fixed known format)
- Use **"Date operation"** as the transaction date
- **Only keep debits** (ignore rows where Debit is empty)
- **Ignore "Transaction exclue"** rows (internal transfers)
- **Deduplicate** on composite key: date operation + libellé opération + amount — skip already-imported transactions
- After import, show summary: "X new transactions imported, Y duplicates skipped"

#### CSV Format (Banque Populaire)

| Column                       | Example                     |
| ---------------------------- | --------------------------- |
| Date de comptabilisation     | 14/02/2026                  |
| Libelle simplifie            | dr HOARAU sc                |
| Libelle operation            | CB dr HOARAU sc FACT 130226 |
| Reference                    | (optional)                  |
| Informations complementaires | (optional)                  |
| Type operation               | Carte bancaire              |
| Categorie                    | Sante                       |
| Sous categorie               | Consultation medicale       |
| Debit                        | -35,00                      |
| Credit                       | +43,00                      |
| Date operation               | 13/02/2026                  |
| Date de valeur               | 16/02/2026                  |
| Pointage operation           | 0                           |

### 3. Category Mapping

- Mapping rules: bank **"Sous categorie"** → user budget category
- Managed in a settings screen (list all rules, add / edit / delete)
- **During import**: transactions with unmapped sub-categories land in a "to classify" queue
- User picks a budget category for each unmapped sub-category → rule is created automatically for future imports
- Transactions can also be left uncategorized and dealt with later

### 4. Merchant Aliases

- Optional: rename a merchant for display readability
- Maps the bank's "Libelle simplifie" to a user-defined name
- Examples:
  - "SARL CHEVALLIER" → "Boulangerie Chevallier"
  - "CB CARREFOUR MARKE" → "Carrefour"
- Purely cosmetic, no impact on categorization

### 5. Monthly View

- Select a month → see all expenses grouped by budget category
- Per category: total spent, transaction count
- Expand a category → individual transactions (date, merchant name or alias, amount)
- "Uncategorized" section at the bottom for unmapped transactions
- Monthly total at the top

### 6. History / Trends

- Table view: months as columns, categories as rows, amounts in cells
- Helps spot spending patterns across months
- No charts for MVP — data table only

### 7. Authentication

- Email + password login
- Two accounts sharing one household
- Both users see and edit the same data

---

## User Flow

1. **First time**: create budget categories
2. **Upload CSV** → new transactions are imported
3. **Unmapped sub-categories appear** → assign them to budget categories (rules saved for future)
4. **View monthly dashboard** → spending by category
5. **Next month**: upload new CSV → most transactions auto-categorize, only new sub-categories need mapping
6. **Over time**: browse history to see spending trends and adjust the budget

---

## Tech Stack

### Toolchain

- **Vite+** (`vp`) drives dev, build, test (Vitest 5), lint (Oxlint), and format (Oxfmt)
- **pnpm** workspaces, **Node 26**

### Frontend

- **Vite+ (Vite 8 / Rolldown)** + React 19 + TypeScript 7
- **TanStack Router** (type-safe routing)
- **TanStack Query** (data fetching / cache)
- **styled-components** (styling)

### Backend

- **Express** + TypeScript
- REST API
- **multer** for CSV file upload

### Database

- **SQLite** via **Drizzle ORM**
- No DB server — single file on disk
- Drizzle for typed queries and migrations

### Auth

- Session-based: bcrypt + HTTP-only cookie
- DIY, no third-party auth provider

### Deployment

- **Docker Compose**: single container serving API + static frontend build
- SQLite volume for persistence
- Nginx reverse proxy on VPS

### Project Structure

```
budget-app/
  packages/
    frontend/     # Vite + React
    backend/      # Express API
    shared/       # Shared TypeScript types
```

### Testing

Tests run via **Vitest 5 through Vite+** (`vp test` / `pnpm test`); test APIs import from `vite-plus/test`.

**Backend**

- **Supertest** for HTTP endpoint testing
- SQLite **in-memory database** for test isolation
- Cover: CSV parsing, mapping rules, deduplication, API endpoints

**Frontend**

- **React Testing Library** for component and hook tests
- **MSW** (Mock Service Worker) to mock API calls
- Cover: import flow, category mapping UI, monthly view logic

**E2E**

- Skipped for MVP — add Playwright later if needed

### Code Quality

- **Oxlint** via `vp check` — type-aware lint and type-checking in one command
- **Oxfmt** via `vp fmt` — formatting with the default style
- No pre-commit hooks — see `docs/void0-migration.md` (decision #3)

---

## Out of Scope (MVP)

- Budget definition in the app (stays in Excel for now)
- Budget vs. actual comparison
- Automatic bank sync
- Income / credit tracking
- Graphs / charts
- Mobile app (responsive web is enough)
- Multi-currency
- Recurring transaction detection
