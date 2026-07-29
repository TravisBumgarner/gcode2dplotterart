# One image: the renderer and the server it is served from.
#
# Debian, not Alpine, on purpose.
#
# `serialport` is a native addon. Its prebuilt binaries are glibc; on musl there
# is no prebuild, so `npm ci` falls back to compiling from source and the image
# needs a whole toolchain — under QEMU that turns a 30-second build into a very
# long one, for a runtime that then behaves subtly differently. bookworm-slim is
# a few MB larger and just works.

# ---------------------------------------------------------------- renderer
FROM node:22-bookworm-slim AS client
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html ./
COPY src ./src
# The client imports the wire types straight out of the server rather than
# keeping a copy of them, so the protocol cannot drift between the two halves
# of an emergency stop. Types only — nothing here ends up in the bundle.
COPY server/src/protocol.ts ./server/src/protocol.ts
RUN npm run build

# ------------------------------------------------------------------ server
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/tsconfig.json server/tsconfig.build.json ./
COPY server/src ./src
RUN npm run build

# Reinstall with dev dependencies pruned. `npm ci --omit=dev` from scratch is
# what gets the right prebuild for the target arch into the runtime layer.
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

# ----------------------------------------------------------------- runtime
FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production

# `SerialPort.list()` shells out to `udevadm` on Linux to read the USB
# descriptors it ranks ports by. Without it enumeration fails outright with
# "spawn udevadm ENOENT" — the server starts fine and then has no ports to
# offer, which is a confusing way to find out.
RUN apt-get update \
  && apt-get install -y --no-install-recommends udev \
  && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=client /app/dist ./client
COPY server/package.json ./

# The UI and the API come off the same port, from this process. There is no
# second web server to run, and nothing to keep in sync between them.
ENV CLIENT_DIR=/app/client

# The node user needs to be in the group that owns the tty device, or opening
# it fails with EACCES. On Raspberry Pi OS that group is `dialout` (GID 20).
# Compose passes the real GID via `group_add:` — see docker-compose.example.yml.
USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
