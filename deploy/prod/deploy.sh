#!/usr/bin/env bash
# Deploy EduNext production lên VPS.
# Yêu cầu: SSH key tới VPS đã cấu hình; trên VPS đã có:
#   $APP_DIR/backend.env   (SUPABASE_*, JWT_SECRET, FPT_API_KEY, FRONTEND_URL)
#   $APP_DIR/.env           (VITE_* cho build + SITE_ADDRESS)
#   docker network edunext-edge (Caddy dùng chung)
set -euo pipefail

VPS="${VPS:-deployer@103.195.237.150}"
APP_DIR=/opt/edunext/prod/app
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
URL="${URL:-https://edunext.vmgenglish.edu.vn}"

echo "== 1/4. rsync source → VPS =="
rsync -az --delete \
  --exclude 'node_modules' --exclude '.git' --exclude 'dist' \
  --exclude 'backend/.env' --exclude 'frontend/.env*' --exclude '*.log' \
  -e "ssh -o BatchMode=yes" \
  "$REPO_DIR/backend" "$REPO_DIR/frontend" "$REPO_DIR/deploy" \
  "$VPS:$APP_DIR/repo/"

echo "== 2/4. đồng bộ compose + Caddyfile từ repo =="
ssh -o BatchMode=yes "$VPS" "cp $APP_DIR/repo/deploy/prod/docker-compose.yml $APP_DIR/docker-compose.yml && cp $APP_DIR/repo/deploy/prod/Caddyfile $APP_DIR/Caddyfile"

echo "== 3/4. build + up =="
ssh -o BatchMode=yes "$VPS" "cd $APP_DIR && docker compose build && docker compose up -d"

echo "== 4/4. health check (nội bộ qua network) =="
sleep 6
ssh -o BatchMode=yes "$VPS" "docker exec edunext-prod-frontend wget -qO- http://backend:3001/api/health"; echo
if curl -s -o /dev/null --max-time 8 "$URL/"; then
  curl -s -o /dev/null -w "SPA công khai: %{http_code}\n" "$URL/"
  curl -s "$URL/api/health"; echo
else
  echo "(DNS chưa trỏ về VPS — bỏ qua kiểm tra công khai, đúng khi chưa cutover)"
fi
echo "✅ Deploy production xong"
