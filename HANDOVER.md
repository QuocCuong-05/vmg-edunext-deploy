# HANDOVER — Hệ thống VMG EduNext

> Tài liệu bàn giao cho **dev tiếp nhận**. Đọc theo thứ tự: file này (tổng quan) → `RUNBOOK.md` (vận hành) → `README.md` (sản phẩm & quick start) → `UXUI_RULES.md` (quy ước UI).
> Cập nhật lần cuối: 16/09/2026 (sau khi hoàn tất di trú lên VPS Việt Nam).

---

## 1. Tổng quan sản phẩm

- **Là gì:** nền tảng phát triển năng lực tiếng Anh cho giáo viên (VMG) — khóa Pronunciation, ViMi AI (chat/luyện nói/sinh giáo án), quiz, XP/quest, cộng đồng, CMS blog, chứng chỉ.
- **Mô hình:** tài khoản **Plus** (4 gói: 59k/147k/264k/399k) — thanh toán chuyển khoản thủ công, admin duyệt đơn; paywall Free/Plus xem chi tiết trong `README.md`.
- **Người dùng hiện tại:** 1 tài khoản admin `cuonghq.dev@gmail.com` (role admin, Plus đến 13/02/2027).
- **Nội dung hiện có:** 3 khóa / **9 module / 351 hoạt động** (299 bài có nội dung HTML, 43 video_lesson, 258 practice, 1 slides), **466 từ luyện nói**, **280 câu hỏi practice**, 366 file storage (~337 MB).
- **URL:** prod `https://edunext.vmgenglish.edu.vn` · staging `https://staging.edunext.vmgenglish.edu.vn`.

## 2. Kiến trúc hệ thống

```
Người dùng (browser)
    │ HTTPS
    ▼
Caddy dùng chung (edunext-edge-caddy)        ← TLS Let's Encrypt, cổng 80/443
    ├── edunext.vmgenglish.edu.vn         → edunext-prod-frontend:80
    └── staging.edunext.vmgenglish.edu.vn → edunext-staging-frontend:80
                                                │  (Caddy nội bộ — HTTP)
                                                ├── /api/*                     → backend:3001 (Express)
                                                ├── /auth/v1·/rest/v1·/storage/v1·/realtime/v1·/functions/v1
                                                │                              → api-gw:8000 (Envoy)
                                                └── còn lại                    → SPA tĩnh /srv/frontend

Supabase self-hosted (mỗi môi trường 1 stack, 11 container):
  Postgres 17.6 · GoTrue (auth) · PostgREST · Storage (+ imgproxy) · Realtime
  · Edge Functions · Studio · Supavisor (pooler) · Envoy (api-gw) · Meta
```

- **Frontend:** React 18 + Vite 5, SPA tĩnh, gọi API qua `/api` cùng domain; session JWT lấy từ `supabase-js`.
- **Backend:** Node 22 + Express (ESM), dùng `SERVICE_ROLE_KEY` (legacy JWT) để gọi Supabase.
  - `SUPABASE_URL` phải là **domain công khai** của môi trường (vì `storage.getPublicUrl()` sinh URL từ đó).
  - Đã bật `app.set('trust proxy', 1)` — cần thiết vì chạy sau 2 lớp Caddy (rate-limit đọc IP đúng).
- **Storage backend:** file, layout trên đĩa `/opt/edunext/<env>/supabase/volumes/storage/stub/stub/<bucket>/<tên-object>/<version-uuid>`.
  - Object bị đổi tên/version khi re-upload — nhớ điều này khi backup/restore storage.
- **Video bảo mật:** bucket `lesson-videos` **private**, phát qua signed URL TTL 60' (`GET /api/videos/token/:lessonId` sau khi kiểm tra quyền).
- **Tài liệu thiết kế chi tiết:** xem `README.md` mục Architecture (auth flow, video, progress, Plus, AI limits).

## 3. Hạ tầng & môi trường

| | Staging | Production |
|---|---|---|
| URL | staging.edunext.vmgenglish.edu.vn | edunext.vmgenglish.edu.vn |
| App | `/opt/edunext/staging/app` | `/opt/edunext/prod/app` |
| Supabase | `/opt/edunext/staging/supabase` | `/opt/edunext/prod/supabase` |
| DB container | `supabase-db` | `supabase-prod-db` |
| Backend / Frontend | `edunext-staging-{backend,frontend}` | `edunext-prod-{backend,frontend}` |

- **VPS:** Fast Byte (Việt Nam), `deployer@103.195.237.150` — SSH key-only, sudo NOPASSWD; Ubuntu 22.04, 4 CPU / 8 GB / 79 GB; Docker + Compose; UFW mở 22/80/443.
- **Caddy chung:** `/opt/edunext/caddy` (nắm 80/443, tự gia hạn Let's Encrypt).
- **Script vận hành:** `/opt/edunext/scripts` · **Log:** `/opt/edunext/logs` · **Backup:** `/opt/edunext/backups` · **Secrets:** `/opt/edunext/secrets`.
- **Docker networks:** `edunext-edge` (Caddy ↔ 2 frontend), `edunext-{staging,prod}_app`, `supabase-{staging,prod}_default`.
- **DNS:** MatBao — `edunext` và `staging.edunext` đều là bản ghi **A → 103.195.237.150**.
  - Rollback khẩn cấp: trỏ `edunext` về `CNAME vmg-edunext-frontend.onrender.com` (hệ thống cũ vẫn còn).
- **Bên thứ ba:** FastByte (VPS), MatBao (DNS), Gmail SMTP `noreply@vmg.edu.vn` (email + alert), FPT Cloud AI (ViMi), UptimeRobot (monitor ngoài), Render + Supabase Cloud (legacy — chờ tắt).

## 4. Secrets & quyền truy cập

**Tình trạng hiện tại:** chưa có password manager chính thức. Nguồn lưu chính là các file `.env` trên VPS (quyền `600`, user `deployer`) — ai có SSH là đọc được. **Khuyến nghị trước khi bàn giao: tạo password manager (Bitwarden/1Password), nhập toàn bộ danh mục dưới đây và đổi các secret từng lộ trong chat.**

| Secret | Dùng ở đâu | Vị trí hiện tại |
|---|---|---|
| SSH key + sudo `deployer` | Truy cập VPS | Máy quản trị viên; VPS `/home/deployer/.ssh/authorized_keys` |
| `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY` (prod) | GoTrue + backend + frontend build | `/opt/edunext/prod/supabase/.env`, `prod/app/backend.env`, `prod/app/.env`, bản sao `/opt/edunext/secrets/supabase-prod.env` |
| `POSTGRES_PASSWORD`, `DASHBOARD_PASSWORD` | Postgres, Studio | `.env` từng stack Supabase |
| `SMTP_PASS` (Gmail app password `noreply@vmg.edu.vn`) | Email xác nhận/khôi phục + alert vận hành | `.env` stack Supabase; script alert đọc từ `/opt/edunext/secrets/supabase-prod.env` |
| `FPT_API_KEY` | ViMi AI (DeepSeek) | `backend.env` từng môi trường |
| `PAYMENT_APPROVE_SECRET` | HMAC token duyệt đơn (QR) | **Chưa đặt** — code fallback về `JWT_SECRET` (`orders.js:9`). Nếu muốn tách riêng thì thêm biến vào `backend.env` |
| `DEEPGRAM_API_KEY` | TTS (không bắt buộc) | **Chưa đặt** — thiếu thì `/api/tts` trả mock im lặng, browser tự đọc |
| Tài khoản MatBao / FastByte / GitHub / UptimeRobot / FPT / Render | Quản trị dịch vụ | Do quản trị viên giữ (không lưu trong repo) |

**Lưu ý bảo mật:**
- Không commit secret vào git. Các file `.env`, `*.key` đã được `.gitignore` chặn.
- README cũ từng chứa mật khẩu tài khoản staging (vẫn còn trong lịch sử git) → **đổi mật khẩu tài khoản đó** khi bàn giao.
- Ưu tiên đổi: JWT secret (logout toàn bộ user), service/anon key, DB password, SMTP app password.

## 5. Bản đồ code

```
backend/src/
├── index.js              # entry: mount 18 route + trust proxy + error handler
├── routes/               # auth, courses, lessons, videos, quiz, orders, practice,
│                         #   vimi-ai, tts, admin, community, vocabulary, classroom,
│                         #   level, quests, rewards, tips, cms
├── middleware/auth.js    # authenticate, requireAdmin, requireTeacher, optionalAuth
├── lib/                  # plus.js (subscription + AI quota), practiceGrade.js (chấm AI)
├── config/database.js    # supabaseAdmin (service key) + supabasePublic
└── supabase/             # full_schema.sql, schema_diagram.dbml, migration_*.sql (30 file)

frontend/src/
├── features/             # 24 vùng: courses (Course→Module→Sound→Lesson), auth, admin,
│                         #   teacher (chấm bài), quiz, profile, plus, vimi, community, ...
├── components/ui/        # PracticeExercises (MixedPractice), SpeakPractice, Button/Card/...
├── lib/api.js            # request() — LƯU Ý: trả thẳng json.data (không envelope)
├── lib/courseStructure.js# helper cấu trúc khóa
└── App.jsx               # router + route guards

deploy/                   # infra-as-code (xem mục 7)
tools/screenshots/        # script chụp ảnh kiểm tra layout
```

## 6. Mô hình dữ liệu (tóm tắt)

- **Người dùng:** `profiles` (role: `learner` | `teacher` | `admin` | `super_admin`), `plus_subscriptions`, `ai_usage`, `user_vocabulary`, `lesson_progress`.
- **Nội dung:** `courses` → `course_modules` → `lessons`
  - `lessons.item_type`: `video_lesson` | `lesson` | `practice` | `slides`
  - `lessons.practice_type`: `speak_words` | `speak_passage` | `voice_recorder` | `listen_choose` | `listen_fill` | `listen_mark` | `match`
  - Practice: `practice_words` (từ luyện nói), `practice_questions` (câu hỏi), `practice_answers`, `practice_submissions` (bài nói + điểm AI).
- **Thương mại:** `orders`, `plus_subscriptions`, `app_settings` (giá Plus, cấu hình thanh toán).
- **Khác:** `quiz_sets/questions/options`, `quests`, `rewards`, `tips`, `level_challenges`, `content_items` (CMS), `community_*`, `wards`/`schools`.
- **Schema gốc:** `backend/supabase/full_schema.sql` · sơ đồ: `schema_diagram.dbml` (mở bằng dbdiagram.io) · các thay đổi sau này nằm trong `migration_*.sql` (30 file, chạy tuần tự).

## 7. Quy trình dev → deploy

```bash
# Local
cd frontend && pnpm install && pnpm dev     # :5173, proxy /api → :3001
cd backend  && pnpm install && pnpm dev     # :3001

# Deploy (từ máy local, repo ở /home/cuong_05/projects/vmg-edunext)
git push origin staging && git push render staging   # 2 remote như quy ước
bash deploy/staging/deploy.sh                        # build + up + health check
# test staging OK →
bash deploy/prod/deploy.sh
```

- **Nhánh `staging` là nhánh chính.** `main` + Render + Supabase Cloud là legacy, không dùng.
- Build args frontend: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`, `VITE_GA_MEASUREMENT_ID` — giá trị nằm ở `/opt/edunext/<env>/app/.env` trên VPS.
- Sửa Caddyfile chung: sửa `deploy/edge/Caddyfile` → scp lên `/opt/edunext/caddy/Caddyfile` → `docker exec edunext-edge-caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile`.
- **Cạm bẫy đã từng gặp (đừng vấp lại):**
  - `SERVICE_ROLE_KEY` phải là **legacy JWT `eyJ...`** (không dùng `sb_secret_*` — self-hosted trả Unauthorized).
  - `REALTIME_DB_ENC_KEY` phải đúng **16 ký tự**, `VAULT_ENC_KEY` đúng **32 ký tự**.
  - Restore/load dump phải dùng `-U supabase_admin` — role `postgres` **không phải** superuser.
  - `frontend/src/lib/api.js` `request()` trả thẳng dữ liệu — đừng bọc thêm `.data`.
  - Storage: file nằm theo `<bucket>/<tên>/<version>` — sync DB và file phải đi cùng nhau.

## 8. Vận hành (tóm tắt — chi tiết trong `RUNBOOK.md`)

| Việc | Lịch | Script |
|---|---|---|
| Backup (DB + storage + config, retention 7d/4w/3m) | 03:00 giờ VN hằng ngày | `/opt/edunext/scripts/backup.sh` |
| Giám sát (disk/container/HTTPS/cert) + email | mỗi 5 phút | `monitor.sh` |
| Restore-test (tự chứng minh backup dùng được) | mùng 1 hằng tháng | `restore-test.sh` |
| Monitor ngoài VPS | 5 phút | UptimeRobot → `https://edunext.vmgenglish.edu.vn/api/health` |

- Alert email: `quoccuong.dni@vmg.edu.vn` (2 lớp: script trên VPS + UptimeRobot).
- Lệnh nhanh: `docker ps -a` · `docker logs <tên> --tail 100` · `docker compose up -d` (trong thư mục app).

## 9. Nợ kỹ thuật & việc đang treo

1. **Xoay secrets** từng lộ trong quá trình setup (JWT secret, service keys, DB passwords, SMTP app password) — JWT secret đổi sẽ logout toàn bộ user.
2. **Tắt Render + Supabase Cloud** sau 3–7 ngày prod VPS ổn định (lưu dump cuối trước khi xoá).
3. **Đổi mật khẩu admin staging** (`habin05hqc@gmail.com`) — mật khẩu cũ từng nằm trong git history.
4. **Backup chưa off-site**: bản backup đang nằm cùng VPS — nên đẩy thêm ra S3/Backblaze/ổ ngoài khi có điều kiện.
5. **Log limits toàn cục**: app + edge đã có (10MB×3); stack Supabase chưa — chỉnh `daemon.json` trong cửa sổ bảo trì.
6. **Supabase Studio** (giao diện quản trị DB) chưa mở truy cập — cần thì thêm SSH tunnel/mở port tạm.
7. Nội dung: mới có **4 video thật** (monophthong), 260 file `practice-audio` chưa gắn vào bài; nhiều practice chưa có audio.
8. TTS xịn (Deepgram) chưa bật — hiện trả mock, browser tự đọc.
9. Video R2/Cloudflare: kế hoạch tương lai, chưa cần.

## 10. Checklist bàn giao & liên hệ

**Quyền truy cập cần chuyển giao:**
- [ ] GitHub org `Viet-My-Group` + repo `vmg-edunext` (và repo deploy `QuocCuong-05/vmg-edunext-deploy`)
- [ ] SSH VPS + sudo `deployer` (nên tạo key riêng cho người mới, thu hồi key cũ)
- [ ] Panel MatBao (DNS `vmgenglish.edu.vn`)
- [ ] Panel FastByte (quản lý VPS, gia hạn — kiểm tra chu kỳ thanh toán)
- [ ] Hộp thư `noreply@vmg.edu.vn` (Gmail + app password) và email nhận alert `quoccuong.dni@vmg.edu.vn`
- [ ] FPT Cloud (quản lý `FPT_API_KEY`)
- [ ] UptimeRobot (monitor prod/staging)
- [ ] Render + Supabase Cloud (chỉ để tắt)
- [ ] Password manager chứa toàn bộ mục 4

**Bài test trước khi ký bàn giao:**
- [ ] `bash deploy/staging/deploy.sh` chạy thành công
- [ ] `/opt/edunext/scripts/backup.sh` chạy thành công + restore-test PASS
- [ ] Thử dừng 1 container → nhận email cảnh báo → bật lại → nhận email "đã ổn"
- [ ] Đọc hiểu sơ đồ mục 2 và mục 8

**Liên hệ hỗ trợ:** VMG IT `(điền)` · FastByte support `(điền)` · MatBao support `(điền)` · FPT AI support `(điền)`.
