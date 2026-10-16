# Budget Tracker App

Personal budget tracking app for a couple: import bank CSV, map bank categories to custom budget categories, track monthly spending. Full product spec: `SPEC.md`.

Monorepo: `packages/frontend` (Vite + React 19 + TanStack Router/Query + styled-components), `packages/backend` (Express + Drizzle ORM + SQLite), `packages/shared` (types shared by both).

## Commands

- `npm run dev` — build `shared`, then run backend + frontend dev servers
- `npm run lint` / `npm run format` — ESLint / Prettier across all packages
- `npm run test` — all tests (`test:backend` / `test:frontend` for one package)
- `npm run seed` — seed the database
- Drizzle migrations — `npm run --workspace=packages/backend db:generate`, then `db:migrate`

## Conventions

- TypeScript strict mode, no `any`
- Named exports only — no default exports
- Relative imports use explicit `.js` extensions (ESM)
- `packages/shared` is consumed via its built `dist/` output — run `npm run --workspace=packages/shared build` after editing it (root `dev`/`build` do this at startup)

### Frontend

- styled-components only — no inline styles, no CSS files
- No raw fetch in components: API functions in `src/api/`, consumed through TanStack Query hooks in `src/hooks/`
- TanStack Router file-based routes in `src/routes/`; `src/routeTree.gen.ts` and `.tanstack/` are generated — never edit them

### Backend

- Routes in `src/routes/`, business logic in `src/services/`, Drizzle schema in `src/db/schema.ts`
- Tests use in-memory SQLite and shared helpers from `src/test/helpers.ts`

### Testing

- Vitest everywhere; React Testing Library + MSW (`src/mocks/`) in frontend, Supertest in backend
- Co-locate tests next to the file they test (`Foo.tsx` + `Foo.test.tsx`)
- After making changes, run `npm run lint` and `npm run test` to verify nothing is broken

## Git

- Do not commit unless explicitly asked
- Conventional commits (feat:, fix:, chore:, test:, refactor:)
