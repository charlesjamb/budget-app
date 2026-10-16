# Budget Tracker App

Personal budget tracking app for a couple: import bank CSV, map bank categories to custom budget categories, track monthly spending. Full product spec: `SPEC.md`.

Monorepo: `packages/frontend` (Vite+ [Vite 8/Rolldown] + React 19 + TanStack Router/Query + styled-components), `packages/backend` (Express + Drizzle ORM + SQLite), `packages/shared` (types shared by both).

Toolchain: [Vite+](https://viteplus.dev) (`vp`) drives dev, build, test (Vitest 5), lint (Oxlint, type-aware) and format (Oxfmt). pnpm workspaces manage dependencies. Node 26 via `.node-version` / `engines` / Volta pins.

## Commands

- `pnpm install` — install dependencies (frozen lockfile in CI/Docker)
- `pnpm dev` — build `shared`, then run backend + frontend dev servers
- `vp check` — format + lint (type-aware) + type-check, all packages; `vp check --fix` to auto-fix
- `vp fmt` — format the repo (Oxfmt)
- `pnpm test` — all tests via `vp test` (`test:backend` / `test:frontend` for one package)
- `pnpm run seed` — seed the database
- Drizzle migrations — `pnpm --filter @budget-app/backend db:generate`, then `db:migrate`

Run `vp` commands from the workspace root. Without a global `vp` install, use `pnpm exec vp <cmd>` (or `npx --package=vite-plus vp <cmd>`).

## Conventions

- TypeScript strict mode, no `any`; TypeScript 7 (native) — `tsc` stays the build gate for shared/backend
- Named exports only — no default exports
- Relative imports use explicit `.js` extensions (ESM)
- Test APIs import from `vite-plus/test` (thin re-export of Vitest 5) — not `vitest`
- `packages/shared` is consumed via its built `dist/` output — run `pnpm --filter @budget-app/shared build` after editing it (root `dev`/`build` do this at startup)

### Frontend

- styled-components only — no inline styles, no CSS files
- No raw fetch in components: API functions in `src/api/`, consumed through TanStack Query hooks in `src/hooks/`
- TanStack Router file-based routes in `src/routes/`; `src/routeTree.gen.ts` and `.tanstack/` are generated — never edit them
- Vite/test config lives in `vite.config.ts` + `vitest.config.ts` (both from `vite-plus`)

### Backend

- Routes in `src/routes/`, business logic in `src/services/`, Drizzle schema in `src/db/schema.ts`
- Tests use in-memory SQLite and shared helpers from `src/test/helpers.ts`

### Testing

- Vitest 5 via Vite+; React Testing Library + MSW (`src/mocks/`) in frontend, Supertest in backend
- Co-locate tests next to the file they test (`Foo.tsx` + `Foo.test.tsx`)
- Backend `tsc` build emits compiled tests into `dist/` — the `**/dist/**` test exclude keeps them out of runs
- After making changes, run `vp check` and `pnpm test` to verify nothing is broken

## Git

- Do not commit unless explicitly asked
- Conventional commits (feat:, fix:, chore:, test:, refactor:)
