# RUNBOOK — VMG EduNext (VPS Việt Nam)

Tài liệu vận hành hệ thống production/staging chạy trên VPS Fast Byte.

## 1. Tổng quan hạ tầng

```
Internet
   │
   ▼
Caddy dùng chung (edunext-edge-caddy)   ── TLS Let's Encrypt, cổng 80/443
   ├── staging.edunext.vmgenglish.edu.vn ──► edunext-staging-frontend:80
   └── edunext.vmgenglish.edu.vn         ──► edunext-prod-frontend:80
                                               │  (Caddy nội bộ, HTTP)
                                               ├── /api/*        ──► backend:3001 (Node)
                                               ├── /auth|rest|storage|realtime|functions ──► api-gw:8000
                                               └── còn lại       ──► SPA tĩnh /srv/frontend
```

| Thành phần | Staging | Production |
|---|---|---|
| Thư mục app | `/opt/edunext/staging/app` | `/opt/edunext/prod/app` |
| Stack Supabase | `/opt/edunext/staging/supabase` | `/opt/edunext/prod/supabase` |
| DB container | `supabase-db` | `supabase-prod-db` |
| Backend/Frontend | `edunext-staging-{backend,frontend}` | `edunext-prod-{backend,frontend}` |
| Supabase URL | `https://staging.edunext.vmgenglish.edu.vn` | `https://edunext.vmgenglish.edu.vn` |

- VPS: `deployer@103.195.237.150` (SSH key-only), Ubuntu 22.04, 4 CPU / 8 GB / 79 GB.
- Caddy chung: `/opt/edunext/caddy` · Script vận hành: `/opt/edunext/scripts` · Log: `/opt/edunext/logs` · Backup: `/opt/edunext/backups`.
- Secrets: `/opt/edunext/secrets/*.env` (chmod 600) — bản sao `.env` của 2 stack Supabase.

## 2. Deploy

```bash
# Staging (từ máy local, trong repo)
bash deploy/staging/deploy.sh

# Production
bash deploy/prod/deploy.sh
```

- Script rsync source lên VPS → đồng bộ compose/Caddyfile từ repo → `docker compose build && up -d` → health check.
- Build args frontend nằm ở `/opt/edunext/<env>/app/.env` (VITE_*), env backend ở `backend.env`.
- Sau khi sửa `deploy/edge/Caddyfile`: `scp` lên `/opt/edunext/caddy/Caddyfile` rồi
  `docker exec edunext-edge-caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile` (không downtime).

## 3. Backup & Restore

Backup tự động (cron 03:00 giờ VN hằng ngày, xem mục 5):

| File | Nội dung | Dùng khi |
|---|---|---|
| `backups/<env>/db/full-*.sql.gz` | `pg_dumpall`: roles + toàn bộ database của cụm | Thảm hoạ toàn cụm |
| `backups/<env>/db/db-*.sql.gz` | Dump 1 database (đủ schema auth/storage/realtime + data) | Restore 1 môi trường / restore-test |
| `backups/<env>/storage/<ngày>/` | Snapshot storage (hardlink — chỉ tốn thêm dung lượng cho file mới) | Ảnh/video/audio |
| `backups/<env>/config/*` | `.env`, compose, Caddyfile | Khôi phục cấu hình |

Retention: 7 ngày + 4 tuần (thứ Hai) + 3 tháng (mùng 1). Restore-test tự động mùng 1 hằng tháng.

**Restore 1 môi trường (ví dụ prod, vào DB sạch `postgres`):**

```bash
C=supabase-prod-db   # staging: supabase-db
D=$(ls -1t /opt/edunext/backups/prod/db/db-*.sql.gz | head -1)
docker exec $C psql -U postgres -c "drop database if exists restore_check"
docker exec $C psql -U postgres -c "create database restore_check"
gunzip -c "$D" | grep -vE '^(CREATE SCHEMA public;|ALTER SCHEMA public OWNER TO)' \
  | docker exec -i $C psql -U supabase_admin -d restore_check -v ON_ERROR_STOP=1 --single-transaction
# kiểm tra: số bảng public, số khóa học, số user rồi đổi tên DB nếu muốn dùng chính thức
```

- Luôn dùng `-U supabase_admin` (superuser) khi load dump — `postgres` không phải superuser.
- Storage: copy ngược từ `backups/<env>/storage/<ngày>/` về `/opt/edunext/<env>/supabase/volumes/storage/stub/stub/`.

## 4. Giám sát & cảnh báo (2 lớp)

**Lớp 1 — trong VPS:** cron 5 phút/lần (`monitor.sh`): disk >80%/90%, container exited/unhealthy, HTTPS `/api/health` prod+staging, cert <14 ngày.
- Alert email tới `quoccuong.dni@vmg.edu.vn` (qua `notify.py`, Gmail SMTP `noreply@vmg.edu.vn`); chống spam 6h/lỗi; có email "đã ổn".
- Log: `/opt/edunext/logs/{monitor,backup,restore}.log`.

**Lớp 2 — ngoài VPS (UptimeRobot, free):** tài khoản `quoccuong.dni@vmg.edu.vn`, monitor HTTPS check 5 phút/lần:
- `EduNext Production` → `https://edunext.vmgenglish.edu.vn/api/health`
- Bắt được cả trường hợp VPS/mạng sập hoàn toàn (lớp 1 không gửi được).
- ⚠️ Khi thêm/sửa monitor nhớ: alert contact phải **verified**; nếu UptimeRobot báo Down lúc web vẫn vào bình thường thì kiểm tra lại URL (đủ protocol + `/api/health`).

## 5. Cron hiện có (user `deployer`, CRON_TZ=Asia/Ho_Chi_Minh)

```
0 3 * * *   backup.sh          # backup hằng ngày
*/5 * * * * monitor.sh         # giám sát
30 4 1 * *  restore-test.sh    # mùng 1 hằng tháng
```

## 6. Sự cố thường gặp

| Triệu chứng | Xử lý |
|---|---|
| Site 502/không vào | `docker ps -a` → `docker logs <container> --tail 100` → `cd /opt/edunext/<env>/app && docker compose up -d` |
| Cert lỗi/hết hạn | `docker logs edunext-edge-caddy --tail 100` — Caddy tự gia hạn; kiểm tra DNS còn trỏ `103.195.237.150` |
| Hết đĩa | `df -h /` · `docker system df` · xoá backup cũ trong `/opt/edunext/backups` |
| Sai cấu hình Caddy | `docker exec edunext-edge-caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile` rồi `reload` |
| Rollback DNS (khẩn cấp) | MatBao: đổi bản ghi `edunext` về `CNAME vmg-edunext-frontend.onrender.com` (Render + Supabase Cloud vẫn còn nguyên) |

## 7. Lưu ý vận hành

- `backend.env` của prod: `SUPABASE_URL=https://edunext.vmgenglish.edu.vn` (bắt buộc để `getPublicUrl` trả link đúng). Khi đổi env → `docker compose up -d backend`.
- Storage là thứ phình nhanh nhất (video/audio) — theo dõi cùng cảnh báo disk.
- Docker log limits (10MB × 3) đã khai báo trong compose app/edge — áp dụng tự nhiên ở lần recreate tiếp theo.
- Nhánh git: `staging` (chứa toàn bộ hạ tầng). Push lên cả 2 remote: `origin` + `render`. **Không đụng `main`** (Render prod cũ).
- Sau khi ổn định 3–7 ngày: tắt Render + Supabase Cloud (lưu dump cuối), xoay secrets đã từng lộ.
