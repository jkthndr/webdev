FROM node:22-slim

# Install git (used by workspace.ts for per-project checkpoint repos)
# and Playwright system dependencies
RUN apt-get update \
  && apt-get install -y --no-install-recommends git \
  && rm -rf /var/lib/apt/lists/* \
  && npx playwright install-deps chromium

# Default git identity for per-project checkpoint commits (no real human is committing here)
RUN git config --global user.email "webdev@local" \
  && git config --global user.name "webdev"

WORKDIR /app

# Copy package files and install
COPY package.json package-lock.json* ./
RUN npm ci

# Install Playwright browsers
RUN npx playwright install chromium

# Copy source
COPY src/ src/
COPY skills/ skills/
COPY tsconfig.json ./

# Build server
RUN npx tsc -p src/server/tsconfig.json

# Pre-install template dependencies (cached layer)
WORKDIR /app/src/template
COPY src/template/package.json src/template/package-lock.json* ./
RUN npm install
WORKDIR /app

EXPOSE 4500

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -sf http://localhost:4500/api/health || exit 1

CMD ["node", "dist/server/index.js"]
