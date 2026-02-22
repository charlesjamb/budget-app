FROM node:20-slim AS base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/
RUN npm ci

# Copy source
COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY packages/backend/ ./packages/backend/
COPY packages/frontend/ ./packages/frontend/

# Build frontend
RUN npm run --workspace=packages/frontend build

# Build backend
RUN npx --workspace=packages/backend tsc

# Production stage
FROM node:20-slim AS production
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/
RUN npm ci --omit=dev

COPY --from=base /app/packages/shared/src/ ./packages/shared/src/
COPY --from=base /app/packages/backend/dist/ ./packages/backend/dist/
COPY --from=base /app/packages/frontend/dist/ ./packages/frontend/dist/

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "packages/backend/dist/index.js"]
