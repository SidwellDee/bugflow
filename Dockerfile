# syntax=docker/dockerfile:1
ARG NODE_IMAGE=node:22-bookworm-slim

FROM ${NODE_IMAGE} AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM dependencies AS test
COPY accounts.js application.js gmail.js security.js store.js workflow.js projects.js bootstrap-admin.js ./
COPY src/report-data.js src/bug-register-data.js ./src/
COPY tests ./tests
RUN npm test

FROM test AS build
COPY index.html ./
COPY src ./src
RUN npm run build

FROM ${NODE_IMAGE} AS production-dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    BUGFLOW_DB=/data/bugflow.db
WORKDIR /app
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json server.js accounts.js application.js gmail.js security.js store.js workflow.js projects.js bootstrap-admin.js healthcheck.js ./
COPY --chown=node:node scripts/create-admin.js ./scripts/create-admin.js
# Persist the automatically generated mail encryption key beside the database.
RUN mkdir -p /data/.local && chown -R node:node /data \
    && ln -s /data/.local /app/.local
USER node
VOLUME ["/data"]
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
    CMD ["node", "healthcheck.js"]
CMD ["node", "server.js", "--production"]
