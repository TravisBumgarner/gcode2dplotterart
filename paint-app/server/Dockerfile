# Debian, not Alpine, on purpose.
#
# `serialport` is a native addon. Its prebuilt binaries are glibc; on musl there
# is no prebuild, so `npm ci` falls back to compiling from source and the image
# needs a whole toolchain — under QEMU that turns a 30-second build into a very
# long one, for a runtime that then behaves subtly differently. bookworm-slim is
# a few MB larger and just works.
FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

# Reinstall with dev dependencies pruned. `npm ci --omit=dev` from scratch is
# what gets the right prebuild for the target arch into the runtime layer.
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

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
COPY package.json ./

# The node user needs to be in the group that owns the tty device, or opening
# it fails with EACCES. On Raspberry Pi OS that group is `dialout` (GID 20).
# Compose passes the real GID via `group_add:` — see docker-compose.example.yml.
USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
