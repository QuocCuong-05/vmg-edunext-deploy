#!/usr/bin/env bash
# Deploy EduNext staging lên VPS.
# Yêu cầu: SSH key tới VPS đã cấu hình; trên VPS đã có:
#   $APP_DIR/backend.env   (SUPABASE_*, JWT_SECRET, FPT_API_KEY, FRONTEND_URL)
#   $APP_DIR/.env           (VITE_* cho build + SITE_ADDRESS)
set -euo pipefail

VPS="${VPS:-deployer@103.195.237.150}"
APP_DIR=/opt/edunext/staging/app
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
URL="${URL:-https://staging.edunext.vmgenglish.edu.vn}"

echo "== 1/4. rsync source → VPS =="
rsync -az --delete \
  --exclude 'node_modules' --exclude '.git' --exclude 'dist' \
  --exclude 'backend/.env' --exclude 'frontend/.env*' --exclude '*.log' \
  -e "ssh -o BatchMode=yes" \
  "$REPO_DIR/backend" "$REPO_DIR/frontend" "$REPO_DIR/deploy" \
  "$VPS:$APP_DIR/repo/"

echo "== 2/4. đồng bộ compose file từ repo =="
ssh -o BatchMode=yes "$VPS" "cp $APP_DIR/repo/deploy/staging/docker-compose.yml $APP_DIR/docker-compose.yml"

echo "== 3/4. build + up =="
ssh -o BatchMode=yes "$VPS" "cd $APP_DIR && docker compose build && docker compose up -d"

echo "== 4/4. health check =="
sleep 6
curl -s -o /dev/null -w "SPA: %{http_code}\n" "$URL/"
curl -s "$URL/api/health"; echo
echo "✅ Deploy staging xong: $URL"
