#!/usr/bin/env bash
# Backup EduNext (staging + production):
#   - DB: pg_dumpall (roles + toàn bộ database) + pg_dump public (để verify/restore-test)
#   - Storage: snapshot kiểu hardlink (ngày sau chỉ chứa file mới/thay đổi)
#   - Config: backend.env / .env / supabase .env / compose / Caddyfile (chmod 600)
# Retention: 7 ngày + 4 tuần (thứ Hai) + 3 tháng (mùng 1). Lỗi -> email.
set -uo pipefail

BASE=/opt/edunext
BK=$BASE/backups
LOG=$BASE/logs
SCRIPTS=$BASE/scripts
STAMP=$(date +%Y%m%d-%H%M)
mkdir -p "$LOG"

log() { echo "[$(date '+%F %T %Z')] $*"; }

fail() {
  local msg="$1"
  log "FAIL: $msg"
  printf 'Backup THAT BAI tren VPS\nThoi diem: %s\nLoi: %s\nLog: %s/backup.log\n' \
    "$(date '+%F %T %Z')" "$msg" "$LOG" | python3 "$SCRIPTS/notify.py" "[EduNext] Backup loi: $msg" >/dev/null 2>&1 || true
  exit 1
}

for env in staging prod; do
  if [ "$env" = "staging" ]; then c=supabase-db; else c=supabase-prod-db; fi
  d="$BK/$env"
  mkdir -p "$d/db" "$d/storage" "$d/config"

  log "== $env: dump DB ($c) =="
  # full-*: pg_dumpall (roles + toàn bộ database) — dùng cho thảm hoạ toàn cụm
  docker exec "$c" pg_dumpall -U postgres | gzip -9 > "$d/db/full-$STAMP.sql.gz" || fail "$env pg_dumpall"
  # db-*: dump toàn bộ 1 database (đủ schema auth/storage/realtime + data) — để restore-test
  docker exec "$c" pg_dump -U postgres -d postgres --no-owner --no-privileges \
    | gzip -9 > "$d/db/db-$STAMP.sql.gz" || fail "$env pg_dump"
  gzip -t "$d/db/full-$STAMP.sql.gz" || fail "$env full dump hong"
  gzip -t "$d/db/db-$STAMP.sql.gz" || fail "$env db dump hong"
  n=$(gunzip -c "$d/db/db-$STAMP.sql.gz" | grep -c '^CREATE TABLE public\.')
  u=$(gunzip -c "$d/db/db-$STAMP.sql.gz" | grep -c '^COPY auth.users')
  [ "$n" -ge 40 ] || fail "$env db dump chi co $n bang public (<40)"
  [ "$u" -ge 1 ] || fail "$env db dump thieu du lieu auth.users"
  log "$env: DB ok ($n bang public, $u dong auth.users)"

  log "== $env: storage snapshot =="
  src="$BASE/$env/supabase/volumes/storage/stub"
  prev=$(ls -1d "$d/storage"/*/ 2>/dev/null | tail -1 || true)
  dest="$d/storage/$STAMP"
  if [ -n "$prev" ]; then
    sudo rsync -a --delete --link-dest="$prev" "$src/" "$dest/" || fail "$env storage rsync"
  else
    sudo rsync -a "$src/" "$dest/" || fail "$env storage rsync"
  fi
  nfiles=$(sudo find "$dest" -type f | wc -l)
  log "$env: storage ok ($nfiles file)"

  log "== $env: config =="
  cp "$BASE/$env/app/backend.env"    "$d/config/backend-$STAMP.env"  2>/dev/null || true
  cp "$BASE/$env/app/.env"           "$d/config/app-$STAMP.env"      2>/dev/null || true
  cp "$BASE/$env/supabase/.env"      "$d/config/supabase-$STAMP.env" 2>/dev/null || true
  cp "$BASE/$env/app/docker-compose.yml" "$d/config/compose-$STAMP.yml" 2>/dev/null || true
  cp "$BASE/$env/app/Caddyfile"      "$d/config/Caddyfile-$STAMP"    2>/dev/null || true
  chmod 600 "$d/config/"*"$STAMP"* 2>/dev/null || true
done
cp "$BASE/caddy/Caddyfile" "$BK/edge-Caddyfile-$STAMP" 2>/dev/null || true

log "== retention (7 ngay + 4 tuan + 3 thang) =="
prune() {
  local dir="$1" p base d8 ds age dow dom keep
  for p in "$dir"/*; do
    [ -e "$p" ] || continue
    case "$p" in "$BK"/*) ;; *) continue ;; esac
    base=$(basename "$p")
    d8=$(echo "$base" | grep -oE '[0-9]{8}' | head -1) || continue
    [ -n "$d8" ] || continue
    ds="${d8:0:4}-${d8:4:2}-${d8:6:2}"
    age=$(( ( $(date +%s) - $(date -d "$ds" +%s) ) / 86400 ))
    dow=$(date -d "$ds" +%u)
    dom=$(date -d "$ds" +%d)
    keep=0
    [ "$age" -le 7 ] && keep=1
    [ "$dow" = "1" ] && [ "$age" -le 28 ] && keep=1
    [ "$dom" = "01" ] && [ "$age" -le 93 ] && keep=1
    if [ "$keep" = "0" ]; then
      log "  xoa $p (${age} ngay)"
      sudo rm -rf "$p"
    fi
  done
}
for env in staging prod; do
  prune "$BK/$env/db"
  prune "$BK/$env/config"
  prune "$BK/$env/storage"
done

log "== xong: $BK =="
du -sh "$BK" 2>/dev/null | while read -r s p; do log "  tong backup: $s"; done
