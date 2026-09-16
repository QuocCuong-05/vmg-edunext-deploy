#!/usr/bin/env bash
# Mùng 1 hằng tháng: nạp bản dump public mới nhất của PROD vào DB tạm rồi xoá
# để chứng minh backup restore được thật. Lỗi -> email.
set -uo pipefail

BASE=/opt/edunext
LOG=$BASE/logs
SCRIPTS=$BASE/scripts
C=supabase-prod-db
mkdir -p "$LOG"

log() { echo "[$(date '+%F %T %Z')] $*"; }

dump=$(ls -1t "$BASE/backups/prod/db/db-"*.sql.gz 2>/dev/null | head -1 || true)
if [ -z "$dump" ]; then
  log "khong tim thay dump db-*"
  printf 'Khong tim thay dump db-* trong /opt/edunext/backups/prod/db\n' \
    | python3 "$SCRIPTS/notify.py" "[EduNext] Restore-test: khong co dump" >/dev/null 2>&1 || true
  exit 1
fi

ok=1
docker exec "$C" psql -U postgres -q -c "drop database if exists restore_check" >/dev/null 2>&1 || ok=0
docker exec "$C" psql -U postgres -q -c "create database restore_check" >/dev/null 2>&1 || ok=0
if [ "$ok" = "1" ]; then
  # supabase_admin (superuser) vì dump chứa các SET chỉ superuser đặt được (vd realtime schema).
  # Bỏ "CREATE SCHEMA public;" vì DB đích mới đã có sẵn schema public.
  gunzip -c "$dump" | grep -vE '^(CREATE SCHEMA public;|ALTER SCHEMA public OWNER TO)' \
    | docker exec -i "$C" psql -U supabase_admin -d restore_check \
        -v ON_ERROR_STOP=1 --single-transaction -q >/dev/null 2>>"$LOG/restore.log" || ok=0
fi
n=$(docker exec "$C" psql -U supabase_admin -d restore_check -tA \
  -c "select count(*) from information_schema.tables where table_schema='public'" 2>/dev/null | tr -d '[:space:]')
crs=$(docker exec "$C" psql -U supabase_admin -d restore_check -tA \
  -c "select count(*) from public.courses" 2>/dev/null | tr -d '[:space:]')
usr=$(docker exec "$C" psql -U supabase_admin -d restore_check -tA \
  -c "select count(*) from auth.users" 2>/dev/null | tr -d '[:space:]')
docker exec "$C" psql -U postgres -q -c "drop database if exists restore_check" >/dev/null 2>&1 || true

if [ "$ok" = "1" ] && [ "${n:-0}" -ge 40 ] && [ "${crs:-0}" -ge 3 ] && [ "${usr:-0}" -ge 1 ]; then
  log "restore-test OK ($n bang, $crs khoa hoc, $usr user) tu $dump"
else
  log "restore-test FAIL dump=$dump tables=${n:-?}"
  printf 'Restore-test THAT BAI\nDump: %s\nSo bang: %s\nXem log: %s/restore.log\n' \
    "$dump" "${n:-?}" "$LOG" | python3 "$SCRIPTS/notify.py" "[EduNext] Restore-test that bai" >/dev/null 2>&1 || true
fi
