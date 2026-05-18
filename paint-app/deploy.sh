#!/bin/bash
set -euo pipefail

# paint-app is a pure client-side SPA (Web Serial + IndexedDB, no backend),
# so deployment is just: build locally, rsync the static dist/ to the
# NearlyFreeSpeech site's public web root.
#
# Requires an SSH alias in ~/.ssh/config:
#
#   host nfs_gcode2dplotterart
#       HostName ssh.nyc1.nearlyfreespeech.net
#       User tbumgarner_gcode2dplotterart
#       IdentityFile ~/.ssh/nfs_key
#
# Note: Web Serial only works in a secure context — NFS serves the site
# over HTTPS, so this is fine.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REMOTE="${NFS_REMOTE:-nfs_gcode2dplotterart}"
REMOTE_DIR="/home/public"

cd "$SCRIPT_DIR"

echo "📦 Installing dependencies..."
npm install

echo "🎨 Building (tsc + vite)..."
npm run build

echo "🚀 Syncing dist/ to NearlyFreeSpeech ($REMOTE:$REMOTE_DIR)..."
rsync -azPh --delete --timeout=300 \
  dist/ \
  "$REMOTE:$REMOTE_DIR/"

echo "✅ Deployment complete!"
echo "🌐 Live at the site's HTTPS URL"
