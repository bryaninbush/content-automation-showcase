FROM oven/bun:1.3.13

WORKDIR /app

COPY package.json bun.lock* ./
COPY apps ./apps
COPY packages ./packages
COPY tsconfig.base.json ./

RUN bun install --frozen-lockfile || bun install

ENV NODE_ENV=production
EXPOSE 3000

CMD ["bun", "run", "start"]
