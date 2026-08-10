# VMG EduNext — Teacher Development Platform

Nền tảng phát triển năng lực tiếng Anh và giảng dạy dành cho giáo viên.
ViMi AI — trợ lý giảng dạy thông minh (chat + luyện nói + sinh giáo án AI).
Mô hình kinh doanh: **tài khoản Plus** (4 gói) mở toàn bộ khóa học premium.

---

## Quick Start

```bash
# Frontend
cd frontend && pnpm install && pnpm dev      # → http://localhost:5173 (proxy /api → :3001)

# Backend
cd backend && pnpm install && pnpm dev        # → http://localhost:3001 (node --watch)
```

### Environment

**Frontend** (`.env` trong `frontend/`):
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
# VITE_API_URL (tuỳ chọn, mặc định '/api' — dev dùng vite proxy)
```

**Backend** (`.env` trong `backend/`):
```env
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
FPT_API_KEY=sk-your-key                      # ViMi AI (bắt buộc)
JWT_SECRET=your-secret
PAYMENT_APPROVE_SECRET=your-secret           # HMAC token duyệt đơn thanh toán
PORT=3001
```

### Tài khoản staging

| Tài khoản | Vai trò | Ghi chú |
|---|---|---|
| `habin05hqc@gmail.com` / `ngaongo` | Admin (staging) | Test, role admin, không có Plus |
| `cuonghq.dev@gmail.com` | Admin (staging) | Có gói Plus 1 tháng — test paywall Premium |

---

## Tech Stack

| Layer | Công nghệ |
|---|---|
| Frontend | React 18, Vite 5, React Router 6 |
| CSS | CSS variables design system + dark mode |
| Backend | Node.js, Express 4 (ESM) |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| Auth | Supabase Auth — JWT qua supabase-js (session tươi, tự refresh) |
| Video | Supabase Storage — **signed URL TTL 60 phút** (chống tải trực tiếp) |
| QR thanh toán | `qrcode` (chuyển khoản thủ công + admin duyệt) |
| AI Chat | FPT Cloud AI — DeepSeek-V4-Flash (streaming) |
| TTS / STT | Deepgram / browser SpeechSynthesis / Web Speech API |
| Icons | BoxIcons (`react-icons/bi`) |

---

## Features

### Nội dung
- **Khóa học — 7 khóa (84 bài):** 6 khóa cũ + **PRONUNCIATION ALL IN ONE** — 50 bài, 9 module (VOWELS 1-3, CONSONANTS 1-4, STRESS & INTONATION, ADVANCED PRONUNCIATION); VOWELS 1 miễn phí, 8 module còn lại Premium
- **Video bảo mật:** `GET /api/videos/token/:lessonId` → signed URL TTL 60' · ẩn nút tải (`controlsList="nodownload"`) · chặn chuột phải · bài Premium đầu tiên là **teaser 2 phút** (overlay paywall khi hết)
- **Hoàn thành bài học:** phải **xem hết video** (theo dõi `maxWatched`, chặn tua tới trước) — nút hoàn thành mở khi video chạy hết; ping server 10s + khôi phục tiến độ khi reload
- **Từ vựng** — sổ từ cá nhân (Free: tối đa 100 từ)
- **Classroom Phrases** — câu lệnh song ngữ
- **Quiz** — chấm điểm **server-side** (`POST /api/quiz/submit`), lịch sử làm bài cho Plus (`GET /api/quiz/attempts`)

### Tài khoản Plus (subscription)
- **4 gói:** 59.000đ/1 tháng · 147.000đ/3 · 264.000đ/6 · 399.000đ/12 (seed trong `app_settings.plus_prices`)
- **Thanh toán:** chuyển khoản thủ công → admin xác nhận (tab Đơn hàng / QR approve HMAC 10 phút) → kích hoạt subscription (gia hạn chồng thời gian)
- **Paywall Free vs Plus:**

| Tính năng | Free | Plus |
|---|---|---|
| Khóa Premium | preview 2' (bài đầu) | Toàn bộ |
| ViMi chat | 5 lượt/ngày | Không giới hạn |
| ViMi speaking | 3 lượt/ngày | Không giới hạn |
| Thiết kế bài dạy AI | 4 bài/tuần | Không giới hạn |
| Sổ từ | 100 từ | Không giới hạn |
| Quiz | không lưu lịch sử | lưu + xem lại |
| XP | 1x | **1.2x** |
| Cửa hàng | hạng cơ bản | thêm quà hạng Plus |
| Chứng chỉ | khóa free | khóa premium + tải PDF |

- Badge 💎 trên avatar (menu "Gói Plus của bạn" / "Nâng cấp Plus")

### AI & Học tập
- **ViMi AI** — chat streaming + luyện nói (phản hồi JSON) + sinh giáo án AI (`/api/vimi-ai/chat`, `/lesson-plan`); giới hạn lượt qua bảng `ai_usage`
- **Dashboard** — quest hàng ngày/tuần, XP, streak
- **Bảng xếp hạng** — lọc theo **phường/xã + trường thật** (bảng `wards`/`schools`; profile chọn qua dropdown)
- **Cộng đồng** — bài viết, like/comment/share, nhóm, report
- **Cửa hàng phần thưởng** — đổi vật phẩm bằng XP (có quà hạng Plus)
- **Chứng nhận** — certificate hoàn thành (PDF cho Plus)

### Quản trị (`/admin/data` — tab Tổng quan mặc định)
- **Tổng quan** — KPI: tổng user, user hoạt động 7 ngày, điểm quiz TB, đơn chờ duyệt, doanh thu tháng, Plus active, top 10 XP (auto-refresh 60s)
- **Đơn hàng** — duyệt thanh toán Plus/khóa
- **Tài khoản Plus** — danh sách subscription, kích hoạt thủ công, gia hạn, hủy
- **Khóa Premium** — đặt premium/free + preview_text (teaser)
- **Nhập CSV** — import 14 bảng (courses, lessons, wards, schools...)
- **Cấu hình** — preview_seconds, bank transfer, giá Plus

---

## Project Structure

```
vmg-edunext/
├── frontend/
│   ├── src/
│   │   ├── components/   # UI: Button, Card, Dialog, Toast
│   │   ├── contexts/     # ThemeModeContext
│   │   ├── features/     # 22 pages (feature-based) — gồm plus/
│   │   ├── lib/          # api, icons, hooks, xp/streak/quest utils
│   │   └── mock/         # Demo data (fallback)
│   └── vite.config.js    # proxy /api → localhost:3001
├── backend/
│   ├── src/
│   │   ├── routes/       # auth, courses, lessons, videos, quiz, orders,
│   │   │                 #   vimi-ai, admin, community, vocabulary, ...
│   │   ├── middleware/   # authenticate, requireAdmin, optionalAuth
│   │   └── lib/          # plus.js (subscription + AI limits), seedData.js
│   └── supabase/
│       ├── full_schema.sql
│       └── migration_*.sql  # paid_courses, plus_enum, plus_subscriptions,
│                             #   lessons_module, wards_schools, ...
└── README.md
```

---

## Architecture

### Auth flow
```
Login → POST /api/auth/login (Supabase Auth) → session JWT
→ /api/auth/me → profile + plus status + aiUsage (cập nhật last_active_at)
→ api.js request() lấy FRESH token từ supabase.auth.getSession() (tự refresh)
ProtectedRoute: không có user → redirect /login
AdminRoute: role admin/super_admin → /admin/*
```

### Video bảo mật
```
LessonView → video_url là storage path → GET /api/videos/token/:lessonId
  → backend kiểm tra quyền (bài free / Plus / enrolled; bài có preview_text = teaser)
  → tạo signed URL Supabase Storage TTL 60 phút → <video> phát
  → teaser: dừng sau preview_seconds + overlay "Nâng cấp Plus"
  → bài premium thường không teaser → 403
Chống tải: controlsList="nodownload" + chặn contextmenu + URL hết hạn
```

### Progress (hoàn thành bài = xem hết video)
```
handleTimeUpdate → maxWatched = max(maxWatched, currentTime)  (bỏ qua lúc seeking)
onSeeking/onSeeked → seek vượt maxWatched → kéo về (chống tua tới trước)
onEnded → mở khoá nút "Đánh dấu hoàn thành"
Ping 10s → POST /api/lessons/:id/progress { watched_seconds } (upsert lesson_progress)
Reload → GET /api/courses/:id/progress → khôi phục maxWatched + completed
```

### Plus & thanh toán
```
/plus → chọn gói → POST /api/orders/create { plan:'plus', period } → đơn pending
→ user xác nhận chuyển khoản → admin duyệt (tab Đơn hàng / QR approve HMAC 10')
→ activatePlus: insert subscriptions(active, end_at = now + period, gia hạn chồng)
→ /auth/me trả user.plus { active, endAt, period } — frontend gate theo isPlus
```

### Giới hạn AI (paywall)
```
/api/vimi-ai/chat (mode chat → 5/ngày; speaking → 3/ngày)
/api/vimi-ai/lesson-plan → 4/tuần
lib/plus.js: canUseAi + ai_usage (RPC increment_ai_usage, period theo ngày/tuần UTC+7)
Plus: bỏ qua giới hạn — trả remaining qua /auth/me (aiUsage)
```

---

## Deployment

| Môi trường | URL | Repo |
|---|---|---|
| Staging | https://vmg-edunext-frontend-mwtw.onrender.com · https://vmg-edunext-backend-5qh2.onrender.com | `QuocCuong-05/vmg-edunext-deploy` (branch `staging`) |
| Production | https://vmg-edunext-frontend.onrender.com · https://vmg-edunext-backend-i469.onrender.com | `Viet-My-Group/vmg-edunext` (branch `main`) |

**Quy trình:**
1. Push staging: `git push render staging && git push origin staging` → Render deploy staging (auto/manual)
2. Test trên staging web → OK → `git checkout main && git merge --ff-only staging && git push origin main`
3. Production Supabase: dán lần lượt các migration trong `backend/supabase/` (enum trước → subscriptions → lessons module → wards/schools) + GRANT
4. Import dữ liệu CSV (courses/lessons/wards/schools) qua tab Nhập CSV

**Deploy staging qua API (khi Render chưa nhận webhook):**
```bash
curl -X POST "https://api.render.com/v1/services/srv-d9lcq4fqj5pc738r5e9g/deploys" \
  -H "Authorization: Bearer <RENDER_API_KEY>"
# srv-d9lbgve7bikc738oevhg = backend
```

---

## Note
- DB dữ liệu người dùng phải nằm **trong nước** (NĐ 13/2023) — kế hoạch nội địa hóa: VPS C6 (Fast Byte) + domain `vmgedunext.vn` (iNET) + Supabase self-hosted; video sẽ chuyển Cloudflare R2 (signed URL qua Worker) khi có thanh toán Cloudflare.
- UX/UI coding rules: xem `UXUI_RULES.md`.
