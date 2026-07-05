#!/bin/bash
# push-assets.sh — One-time script to push Silva MD assets to silva-md-data
#
# Usage:
#   GITHUB_TOKEN=ghp_yourtoken bash push-assets.sh
#   — or —
#   bash push-assets.sh   (will prompt for token)

set -e

if [ -z "$GITHUB_TOKEN" ]; then
  echo "Enter your GitHub Personal Access Token (repo scope):"
  read -rs GITHUB_TOKEN
  echo ""
fi

REPO_URL="https://${GITHUB_TOKEN}@github.com/silvatechnexusinc/silva-md-data.git"
TMP_DIR="/tmp/silva-md-assets-push"

echo "[push-assets] Cloning silva-md-data..."
rm -rf "$TMP_DIR"
git clone "$REPO_URL" "$TMP_DIR"

echo "[push-assets] Copying assets..."
cp -r plugins lib themes smm "$TMP_DIR/"
cp handler.js _fix_agent.js "$TMP_DIR/"
mkdir -p "$TMP_DIR/data"
[ -f data/silvamdboticon.png ] && cp data/silvamdboticon.png "$TMP_DIR/data/"

echo "[push-assets] Committing and pushing..."
cd "$TMP_DIR"
git config user.email "bot@silva-md.local"
git config user.name "Silva MD"
git add .
git commit -m "Add Silva MD assets" || echo "(nothing new to commit)"
git push

echo ""
echo "[push-assets] ✅ Done! Assets are now live at:"
echo "   https://github.com/silvatechnexusinc/silva-md-data"
echo ""
echo "You can now delete the local folders from the main repo:"
echo "   rm -rf plugins lib themes smm handler.js _fix_agent.js"

cd - > /dev/null
rm -rf "$TMP_DIR"
