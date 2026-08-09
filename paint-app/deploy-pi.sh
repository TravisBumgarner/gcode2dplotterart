#!/bin/bash
set -euo pipefail

# Build this working tree straight onto the Pi, bypassing GHCR.
#
# The release path is: push to main -> the workflow builds linux/arm64 under
# QEMU -> `rasppi-utils/stack/deploy.sh` pulls the tag. That is right for
# releases and far too slow a loop for "does this fix the port picker".
#
# So: rsync the source over and build it there. The Pi is arm64, so the build
# is native rather than emulated — about 50s cold, and the `serialport` binding
# still arrives as a prebuilt arm64 binary.
#
# The container is swapped in with an override file passed by -f, NOT with
# `compose.override.yaml`, which compose would auto-load into every subsequent
# deploy and silently pin the stack to a dev image forever.
#
#   ./deploy-pi.sh            # build, swap in the dev image, show the ports
#   ./deploy-pi.sh --revert   # put the stack back on its pinned GHCR tag
#
# `stack/deploy.sh` on the Pi also reverts this, since it re-reconciles from
# the tracked compose.yaml.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PI="${PI:-rasppi@rasppi.local}"
STACK="${STACK:-rasppi-utils/stack}"   # relative = $HOME on the Pi
SRC="${SRC:-paint-app-dev}"
SERVICE=plotter-server
TAG=plotter-server:dev

compose_revert() {
  echo "↩️  Reverting $SERVICE to its pinned image..."
  ssh "$PI" "cd '$STACK' && docker compose up -d --no-deps --force-recreate $SERVICE"
}

if [ "${1:-}" = "--revert" ]; then
  compose_revert
  exit 0
fi

cd "$SCRIPT_DIR"

echo "🧪 Verifying before shipping..."
npm --prefix server run typecheck
npm --prefix server run lint
npm --prefix server test -- --run >/dev/null
npm run lint

# --delete so a file removed here is removed there. The excludes keep this
# Mac's x64 node_modules and stale builds off an arm64 box.
echo "📤 Syncing to $PI:$SRC..."
ssh "$PI" "mkdir -p '$SRC'"
rsync -azh --delete --timeout=300 \
  --exclude 'node_modules' \
  --exclude 'dist' \
  --exclude '*.tsbuildinfo' \
  --exclude 'experiments/venv' \
  --exclude '.git' \
  ./ "$PI:$SRC/"

echo "🔨 Building on the Pi (native arm64)..."
ssh "$PI" "cd '$SRC' && docker build -t '$TAG' ."

# Only the image is overridden; the device rules, group_add and /dev mount all
# still come from the tracked compose.yaml, so this tests the real config.
echo "🚀 Swapping $SERVICE onto $TAG..."
ssh "$PI" "cat > '$SRC/compose.dev.yaml' <<'YAML'
services:
  $SERVICE:
    image: $TAG
    pull_policy: never
YAML
cd '$STACK' && docker compose -f compose.yaml -f ~/'$SRC'/compose.dev.yaml \
  up -d --no-deps --force-recreate $SERVICE"

echo "⏳ Waiting for health..."
BIND_IP=$(ssh "$PI" "grep '^BIND_IP' '$STACK/.env' | cut -d= -f2")
for _ in $(seq 1 30); do
  if ssh "$PI" "curl -fsS http://$BIND_IP:8081/api/health" >/dev/null 2>&1; then
    echo "✅ Deployed. Ports the server now sees:"
    ssh "$PI" "curl -fsS http://$BIND_IP:8081/api/ports"
    echo
    exit 0
  fi
  sleep 2
done

echo "✗ Did not come up. Logs:" >&2
ssh "$PI" "cd '$STACK' && docker compose logs --tail 40 $SERVICE" >&2
compose_revert
exit 1
