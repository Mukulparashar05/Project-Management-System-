# Production image for the Orbit API.
# Debian slim (glibc) keeps bcrypt's prebuilt binary and Prisma's engines working out of the box.
FROM node:24-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS dependencies
COPY package.json package-lock.json ./
# The schema must be present because `npm ci` runs `prisma generate` (postinstall).
COPY prisma ./prisma
RUN npm ci --omit=dev && npm cache clean --force

FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=4000
COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json ./
COPY prisma ./prisma
COPY src ./src
USER node
EXPOSE 4000
# Applies pending migrations, then starts the server.
CMD ["npm", "run", "start:prod"]
