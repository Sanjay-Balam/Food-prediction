FROM node:22-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@12.11.2 --activate

WORKDIR /app

# Copy monorepo workspace dependencies
COPY pnpm-lock.yaml package.json ./
COPY apps/landing-page/package.json ./apps/landing-page/
COPY apps/demo-web/package.json ./apps/demo-web/

RUN pnpm install --frozen-lockfile

# Copy source files
COPY . .

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3001

RUN pnpm --filter landing-page build

EXPOSE 3001

CMD ["pnpm", "--filter", "landing-page", "start"]
