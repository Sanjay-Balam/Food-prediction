FROM node:22-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@12.11.2 --activate

WORKDIR /app

# Copy monorepo workspace dependencies
COPY pnpm-lock.yaml package.json ./
COPY apps/demo-web/package.json ./apps/demo-web/
COPY apps/landing-page/package.json ./apps/landing-page/

RUN pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Production environment variables and build
ARG NEXT_PUBLIC_API_URL=https://api.logeeca.com
ARG NEXT_PUBLIC_DEFAULT_RESTAURANT_ID=hyderabad_demo
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_DEFAULT_RESTAURANT_ID=$NEXT_PUBLIC_DEFAULT_RESTAURANT_ID
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

RUN pnpm --filter demo-web build

EXPOSE 3000

CMD ["pnpm", "--filter", "demo-web", "start", "--", "-p", "3000", "-H", "0.0.0.0"]
