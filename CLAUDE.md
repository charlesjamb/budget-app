# Budget Tracker App

## Project Overview

Personal budget tracking app for a couple. Import bank CSV, map bank categories to custom budget categories, track monthly spending. See `SPEC.md` for the full product spec.

## Tech Stack

- **Monorepo** with packages: `frontend`, `backend`, `shared`
- **Frontend**: Vite + React + TypeScript, TanStack Router, TanStack Query, styled-components
- **Backend**: Express + TypeScript, Drizzle ORM, SQLite
- **Testing**: Vitest, React Testing Library, MSW, Supertest
- **Code quality**: ESLint (flat config), Prettier, Husky + lint-staged

## Commands

- `npm run lint` — run ESLint across all packages
- `npm run format` — run Prettier across all packages
- `npm run test` — run all tests
- `npm run test:backend` — run backend tests only
- `npm run test:frontend` — run frontend tests only

## Conventions

### General
- All code is TypeScript — no `any`, use strict mode
- Shared types live in `packages/shared` and are imported by both frontend and backend
- Use named exports, not default exports
- Keep files small and focused — one component/module per file

### Frontend
- Use styled-components for all styling — no inline styles, no CSS files
- Use TanStack Query for all API calls — no raw fetch in components
- Use TanStack Router for routing — file-based route definitions
- Components go in `src/components/`, pages in `src/routes/`
- Co-locate tests next to the files they test (`Foo.tsx` + `Foo.test.tsx`)

### Backend
- Express routes go in `src/routes/`
- Business logic goes in `src/services/`
- Drizzle schema in `src/db/schema.ts`
- Co-locate tests next to the files they test
- Use in-memory SQLite for tests

### Testing
- Write tests for all new code
- Frontend: use React Testing Library, mock API with MSW
- Backend: use Supertest for endpoint tests, Vitest for unit tests
- Run `npm run lint` and `npm run test` after making changes to verify nothing is broken

### Git
- Do not commit unless explicitly asked
- Use conventional commits (feat:, fix:, chore:, test:, refactor:)
