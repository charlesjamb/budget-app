# Migration to the VoidZero stack (Vite+)

Status: planned — not started
Date: 2026-10-16

## Goal

Replace the current hand-assembled toolchain (Vite 7, Vitest 3, ESLint, Prettier, concurrently, npm) with
[Vite+](https://viteplus.dev) 1.x: one `vp` CLI and one `vite.config.ts` driving Vite 8 (Rolldown), Vitest,
Oxlint, Oxfmt and the Vite Task runner.

## Current state

| Area          | Today                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------- |
| Runtime       | Node 24.8 locally, `node:20-slim` in Docker, no version pinning                               |
| Package mgr   | npm workspaces, `package-lock.json`, `"@budget-app/shared": "*"`                              |
| Dev server    | Vite 7.3 + `@vitejs/plugin-react` 4.7, TanStack Router plugin                                 |
| Tests         | Vitest 3.2, one `vitest.config.ts` per package (jsdom / node)                                 |
| Lint          | ESLint 9 + typescript-eslint + eslint-plugin-react-hooks                                      |
| Format        | Prettier 3 (`printWidth: 80`, double quotes, trailing commas)                                 |
| Types         | TypeScript 5.9; `tsc -b` in the frontend build, `tsc` emit for shared/backend                 |
| Hooks         | Effectively none: Husky removed in `460dfa0`, leftovers in `.husky/_`, unused `.lintstagedrc` |
| Orchestration | `concurrently` for `dev`                                                                      |

## Decisions

| #   | Topic       | Decision                                                                                                      | Why                                                                                                                                                                                        |
| --- | ----------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Scope       | Vite+ all-in, in two phases (upstream upgrades first, then `vp migrate`)                                      | One CLI/config for a small monorepo; isolates upgrade breakage from tooling breakage                                                                                                       |
| 2   | Runtime     | Node 26: `.node-version`, `engines: ">=26"`, `node:26-slim` in both Docker stages                             | Vite+ needs `^22.18 \|\| ^24.11 \|\| >=26`; 26 becomes LTS in Oct 2026                                                                                                                     |
| 2b  | Native deps | `better-sqlite3` 11 → 13, `bcrypt` 5 → 6                                                                      | 11.x has no Node 26 prebuild _and_ no longer compiles (removed V8 APIs); 13.x uses Node-API. `bcrypt` 5 uses per-ABI `node-pre-gyp` prebuilds — no Node 26 build; 6.0 is the N-API version |
| 3   | Hooks       | None. Delete `.husky/`, `.lintstagedrc`; `git config --unset core.hooksPath`                                  | Keep it simple; a `prepare` script breaks `install --prod` in Docker (same reason Husky was removed)                                                                                       |
| 4   | Builds      | Keep `tsc` for shared and backend, `tsx watch` for backend dev                                                | Already works; tsdown adds bundling risk (native deps, runtime paths) for no gain                                                                                                          |
| 5   | Types       | TypeScript 7 everywhere. `vp check` (typeAware + typeCheck) for dev, `tsc` stays in builds as the Docker gate | TS 7 stable since 2026-07; nothing left needs the TS API once ESLint is gone; one Go-based checker                                                                                         |
| 6   | Package mgr | pnpm 12.14.0 via `packageManager`, `workspace:*`, `allowBuilds`, Docker `pnpm install --prod`                 | Requested; `install --prod` keeps the layout so `../../frontend/dist` still resolves                                                                                                       |
| 7   | Style       | Oxfmt and Oxlint defaults; only deviation: Oxlint `react` plugin. Whole repo formatted in one commit          | Defaults by choice; `react` plugin is off by default and carries rules-of-hooks / exhaustive-deps                                                                                          |
| 8   | Validation  | Baseline, per-step gates, final gates (see below)                                                             | Catch silently dropped tests and Docker/runtime regressions                                                                                                                                |

### Deferred

- `vp pack` (tsdown) for `shared`: revisit if rebuilding shared during dev becomes painful.
- CI pipeline: the Docker build is the only automatic gate.

## Target configuration

`pnpm-workspace.yaml`

```yaml
packages:
  - packages/*
allowBuilds:
  bcrypt: true
  better-sqlite3: true
  esbuild: true
  msw: false
```

Root `vite.config.ts` (lint/fmt are workspace-wide in Vite+)

```ts
import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
    plugins: ["eslint", "typescript", "unicorn", "oxc", "react"],
    options: { typeAware: true, typeCheck: true },
    ignorePatterns: ["**/routeTree.gen.ts", "**/dist/**"],
  },
  fmt: {
    ignorePatterns: ["**/routeTree.gen.ts"],
  },
});
```

`packages/backend/tsconfig.json`: add `"types": ["node"]` (TS 6+ defaults `types` to `[]`).

Dockerfile (both stages): `FROM node:26-slim`, `RUN npm install -g pnpm@12.14.0` (corepack is no longer
shipped with Node 25+), copy `pnpm-lock.yaml` + `pnpm-workspace.yaml`, `pnpm install --frozen-lockfile`
(build) / `pnpm install --prod --frozen-lockfile` (production), `pnpm --filter <pkg> build`.

## Execution plan

Work in a separate worktree and branch. One commit per step.

### Step 0: baseline (current npm setup)

- Record test files / tests passed per package (21 test files today).
- Record frontend `dist/assets` size.

Recorded 2026-10-16 in the `chore/void0-migration` worktree (Node 24.8.0, npm workspaces):

- Backend: 11 test files, 106 tests passed
- Frontend: 10 test files, 42 tests passed (after `test:` commit pinning system time in
  `split.test.tsx` — it had been failing since March because the app derives the month from
  the current date while the fixtures hardcode `2026-02`)
- Total: 21 test files, 148 tests
- ESLint: clean (0 errors)
- Frontend bundle: `dist/assets/index-*.js` 421.37 kB (gzip 128.51 kB), `dist/assets` 412 kB on disk

### Phase 1: prerequisites

Executed order swaps native deps before the Node switch: better-sqlite3 11 / bcrypt 5 cannot be
built against Node 26 at all, so the Node 26 commit would have no working backend otherwise.

| Step | Commit                                                                                             |
| ---- | -------------------------------------------------------------------------------------------------- |
| 1a   | `build:` native deps: better-sqlite3 11 → 13, bcrypt 5 → 6                                         |
| 1b   | `build:` Node 26 (`.node-version`, `engines`, Volta pin, Docker base image)                        |
| 1c   | `build:` npm → pnpm (`pnpm import`, workspace yaml, `allowBuilds`, `workspace:*`, Docker, scripts) |
| 1d   | `build:` TypeScript 5.9 → 7 (+ backend `types: ["node"]`; frontend `vite/client` if needed)        |
| 1e   | `build:` Vite 7 → 8 (+ plugin-react compatible with Vite 8)                                        |
| 1f   | `build:` Vitest 3 → 4                                                                              |

Gate after each step: `pnpm install --frozen-lockfile` clean (no `ERR_PNPM_IGNORED_BUILDS`), test count equals
baseline, shared/backend/frontend builds pass.

### Phase 2: Vite+

| Step | Commit                                                                                              |
| ---- | --------------------------------------------------------------------------------------------------- |
| 2a   | `chore:` `pnpm dlx --package=vite-plus@<latest> vp migrate --no-interactive`, then review the diff  |
| 2b   | `chore:` remove ESLint / Prettier / concurrently configs and deps, Husky leftovers, `.lintstagedrc` |
| 2c   | `style:` `vp fmt` across the whole repo; add the SHA to `.git-blame-ignore-revs`                    |
| 2d   | `fix:` new type-aware lint findings (≤ ~20 fixed; otherwise set to warn and list as follow-up)      |
| 2e   | `chore:` remove generated "Vitest v4 compatibility" settings one at a time where tests still pass   |
| 2f   | `docs:` update `AGENTS.md` (pnpm, `vp check`, `vp test`, `vp run`)                                  |

Review points for 2a: root `vite.config.ts` lint/fmt blocks, `test` blocks merged into each package's
`vite.config.ts`, `vitest` → `vite-plus/test` imports, `vite` override to `@voidzero-dev/vite-plus-core`,
scripts rewritten to `vp`.

### Final gates

- `vp check`: format clean, 0 lint errors, type-check clean
- `vp test`: test count equals baseline, no new skips
- `vp build`: frontend builds, bundle size close to baseline
- `tsc` builds for shared and backend emit `dist/`
- Dev smoke (playwright-cli): `:5173` proxies `/api` to `:3000`, login, budget and transactions pages render
- Docker: `docker build` + `docker run`; `GET /` serves `index.html`, `POST /api/auth/login` works
  (check `docker info` first; otherwise this becomes a manual step on the deploy machine)

## Expected file changes

- Added: `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `.node-version`, root `vite.config.ts`, `.git-blame-ignore-revs`
- Removed: `package-lock.json`, `eslint.config.js`, `.prettierrc`, `.lintstagedrc`, `.husky/`,
  `packages/*/vitest.config.ts`
- Modified: all `package.json` files, `packages/backend/tsconfig.json`, `packages/frontend/vite.config.ts`,
  `Dockerfile`, `AGENTS.md`, test imports, repo-wide formatting

## References

- Vite+ 1.0 announcement: https://voidzero.dev/posts/announcing-vite-plus-1-0
- Vite+ migration guide: https://viteplus.dev/guide/migrate
- Vite+ migration rules: https://viteplus.dev/guide/migrate-rules
- Vite+ check (type-aware/type-check): https://viteplus.dev/guide/check
- Oxlint built-in plugins: https://oxc.rs/docs/guide/usage/linter/plugins.html
- TypeScript 7.0 announcement: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0
- pnpm build settings (`allowBuilds`): https://pnpm.io/settings/build
