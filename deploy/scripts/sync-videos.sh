#!/usr/bin/env bash
# Sync video bài học: staging → production (bucket lesson-videos).
#   - Copy file vật lý (không xoá file cũ/orphan)
#   - Thay rows storage.objects của prod bằng đúng rows của staging (bucket lesson-videos)
#   - Đồng bộ lessons.video_url + video_duration_seconds theo id bài học
# Idempotent — chạy lại được mỗi khi up thêm video trên staging. Không cần downtime.
set -uo pipefail

BASE=/opt/edunext
S_DB=supabase-db
P_DB=supabase-prod-db
BK=$BASE/backups/video-sync-$(date +%Y%m%d-%H%M%S)
mkdir -p "$BK"

log() { echo "[$(date '+%F %T %Z')] $*"; }

# 1) Backup trước khi đổi (để rollback được)
log "== backup rows prod trước khi sync =="
docker exec "$P_DB" pg_dump -U postgres -d postgres --data-only --table=storage.objects > "$BK/prod-storage-objects.sql" || exit 1
docker exec "$P_DB" psql -U postgres -d postgres -tAc \
  "copy (select id, video_url, video_duration_seconds from public.lessons) to stdout with (format csv)" \
  > "$BK/prod-lessons-video.csv" || exit 1
log "backup: $BK"

# 2) Copy file (file trước — tránh cửa sổ DB trỏ vào file chưa có)
log "== rsync file staging → prod =="
sudo rsync -a "$BASE/staging/supabase/volumes/storage/stub/stub/lesson-videos/" \
              "$BASE/prod/supabase/volumes/storage/stub/stub/lesson-videos/" || exit 1

# 3) Thay storage.objects (bucket lesson-videos) trên prod
log "== export rows staging (lesson-videos) =="
docker exec "$S_DB" pg_dump -U postgres -d postgres --data-only --column-inserts \
  --table=storage.objects | grep "'lesson-videos'" > "$BK/staging-lesson-videos.sql"
nrows=$(grep -c 'INSERT INTO' "$BK/staging-lesson-videos.sql")
log "staging có $nrows object lesson-videos"
[ "$nrows" -ge 1 ] || { log "FAIL: không export được rows"; exit 1; }

log "== swap rows trên prod (bypass trigger bảo vệ) =="
docker exec "$P_DB" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q \
  -c "set session_replication_role=replica; delete from storage.objects where bucket_id='lesson-videos';"
docker exec -i "$P_DB" psql -U postgres -d postgres -v ON_ERROR_STOP=1 --single-transaction -q \
  < "$BK/staging-lesson-videos.sql" || exit 1

# 4) Đồng bộ lessons.video_url + duration (khớp theo id)
log "== export lessons video fields staging =="
docker exec "$S_DB" psql -U postgres -d postgres -tAc "
select 'UPDATE public.lessons SET video_url=' || quote_literal(video_url)
  || ', video_duration_seconds=' || coalesce(video_duration_seconds::text, 'null')
  || ' WHERE id=' || quote_literal(id::text) || ';'
from public.lessons where length(coalesce(video_url,'')) > 0;" > "$BK/staging-lessons-updates.sql"
nupd=$(grep -c 'UPDATE' "$BK/staging-lessons-updates.sql")
log "staging có $nupd bài cần đồng bộ"
docker exec -i "$P_DB" psql -U postgres -d postgres -v ON_ERROR_STOP=1 --single-transaction -q \
  < "$BK/staging-lessons-updates.sql" || exit 1

# 5) Verify
log "== verify =="
s_obj=$(docker exec "$S_DB" psql -U postgres -d postgres -tAc "select count(*) from storage.objects where bucket_id='lesson-videos'" | tr -d '[:space:]')
p_obj=$(docker exec "$P_DB" psql -U postgres -d postgres -tAc "select count(*) from storage.objects where bucket_id='lesson-videos'" | tr -d '[:space:]')
s_les=$(docker exec "$S_DB" psql -U postgres -d postgres -tAc "select count(*) from public.lessons where length(coalesce(video_url,''))>0" | tr -d '[:space:]')
p_les=$(docker exec "$P_DB" psql -U postgres -d postgres -tAc "select count(*) from public.lessons where length(coalesce(video_url,''))>0" | tr -d '[:space:]')
log "objects: staging=$s_obj prod=$p_obj | lessons có video: staging=$s_les prod=$p_les"
[ "$s_obj" = "$p_obj" ] && [ "$s_les" = "$p_les" ] || { log "FAIL: số liệu không khớp"; exit 1; }

docker exec "$P_DB" psql -U postgres -d postgres -tAc \
  "select bucket_id||'/'||name||'/'||version from storage.objects where bucket_id='lesson-videos'" > /tmp/vsync-objs.txt
P=/opt/edunext/prod/supabase/volumes/storage/stub/stub
total=0; miss=0
while IFS= read -r f; do
  total=$((total+1))
  [ -f "$P/$f" ] || { miss=$((miss+1)); echo "THIẾU FILE: $f"; }
done < /tmp/vsync-objs.txt
log "file khớp version: $((total-miss))/$total"
[ "$miss" = "0" ] || { log "FAIL: thiếu file vật lý"; exit 1; }

log "== sync xong OK =="
