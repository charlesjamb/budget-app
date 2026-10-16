FROM node:26-slim AS base
WORKDIR /app

# Install pnpm (corepack is no longer shipped with Node 25+)
RUN npm install -g pnpm@12.14.0

# Install dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/
RUN pnpm install --frozen-lockfile

# Copy source
COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY packages/backend/ ./packages/backend/
COPY packages/frontend/ ./packages/frontend/

# Build shared
RUN pnpm --filter @budget-app/shared build

# Build frontend
RUN pnpm --filter @budget-app/frontend build

# Build backend
RUN pnpm --filter @budget-app/backend build

# Production stage
FROM node:26-slim AS production
WORKDIR /app

# Install pnpm (corepack is no longer shipped with Node 25+)
RUN npm install -g pnpm@12.14.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/
RUN pnpm install --prod --frozen-lockfile

COPY --from=base /app/packages/shared/dist/ ./packages/shared/dist/
COPY --from=base /app/packages/backend/dist/ ./packages/backend/dist/
COPY --from=base /app/packages/frontend/dist/ ./packages/frontend/dist/

RUN mkdir -p /app/data && chown -R node:node /app/data

ENV NODE_ENV=production
ENV PORT=3000

USER node

EXPOSE 3000

CMD ["node", "packages/backend/dist/index.js"]
