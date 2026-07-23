# VMG EduNext — Teacher Development Platform

Nền tảng phát triển năng lực tiếng Anh và giảng dạy dành cho giáo viên (demo prototype).  
ViMi AI — trợ lý giảng dạy thông minh, tích hợp chat + luyện nói + sinh giáo án.

---

## Quick Start

```bash
# Frontend
cd frontend
pnpm install
pnpm run dev        # → http://localhost:5173

# Backend (tuỳ chọn, cần cho ViMi AI + API)
cd backend
pnpm install
pnpm start          # → http://localhost:3001
```

**Tài khoản demo:** `teacher@vmg-edunext.com` / `2026demo`

---

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Frontend | React 18, Vite 5, React Router 6 |
| CSS | CSS variables design system + dark mode |
| Backend | Node.js, Express 4 |
| Database | Supabase (PostgreSQL) |
| Auth | JWT (backend) / localStorage (frontend mock) |
| AI Chat | FPT Cloud AI — DeepSeek-V4-Flash |
| TTS | Deepgram Aura-2 / browser SpeechSynthesis |
| STT | Web Speech API |
| Icons | BoxIcons (`react-icons/bi`) |

---

## Features

- **Dashboard** — Thống kê, quest hàng ngày/tuần, lộ trình học tập
- **Khóa học** — 6 khóa (34 bài học) với video YouTube embed
- **Từ vựng** — 82 từ A2-C1, sổ từ cá nhân
- **Classroom Phrases** — 104 câu lệnh song ngữ
- **Quiz** — Trắc nghiệm ngẫu nhiên, +50 XP
- **ViMi AI** — Chat streaming + luyện nói (phản hồi JSON) + sinh giáo án AI
- **Bảng xếp hạng** — Top 8 giáo viên
- **Cộng đồng** — Feed bài viết, nhóm, chủ đề trending
- **Cửa hàng phần thưởng** — Đổi vật phẩm bằng XP
- **Chứng nhận** — Certificate hoàn thành
- **Đặt lịch** — Booking chuyên gia
- **Dark mode** — Theme toggle

---

## API Keys (backend/.env)

```env
FPT_API_KEY=sk-your-key-here       # ViMi AI (bắt buộc)
DEEPGRAM_API_KEY=your-key           # TTS (tuỳ chọn)
SUPABASE_URL=your-url               # Database (tuỳ chọn)
SUPABASE_ANON_KEY=your-key          # Database (tuỳ chọn)
```

---

## Project Structure

```
vmg-edunext/
├── frontend/          # React + Vite
│   ├── src/
│   │   ├── components/   # UI: Button, Card, Dialog
│   │   ├── contexts/     # ThemeModeContext
│   │   ├── features/     # 21 pages (feature-based)
│   │   ├── lib/          # API, icons, hooks, XP utils
│   │   └── mock/         # Demo data
│   ├── pnpm-lock.yaml
│   └── vite.config.js
├── backend/           # Express API
│   ├── src/
│   │   ├── routes/       # auth, courses, lessons, vimi, etc.
│   │   └── lib/          # Prompts, config
│   └── pnpm-lock.yaml
├── .gitignore
└── README.md
```

---

## Architecture

### ViMi AI Chat (streaming)

```
Client → POST /api/vimi-ai/chat { messages, mode }
  → Backend chọn system prompt (chat / speaking)
  → streamText(DeepSeek-V4-Flash) → SSE chunks
  → Client useStreamChat hook → append từng chunk → re-render real-time
```

### Speaking mode

```
Client gửi câu trả lời → AI trả JSON:
{ reaction, comment, correctedResponse, expansionIdeas, improvedResponse, vocabularyExplanations, nextQuestion }
→ SpeakingFeedbackCard render từng field
```

### Auth flow

```
Login → POST /api/auth/login → JWT token → localStorage
ProtectedRoute kiểm tra user → nếu ko có → redirect /login
Backend: middleware/auth.js verify JWT trên mọi request
Frontend mock: AuthContext đọc localStorage, không cần backend
```

### Lesson data flow

```
mock/data.js → Course > Lesson[]
CourseDetail: GET /api/courses/:slug → render lesson list
LessonView: GET /api/lessons/:id → render video + nội dung
Hiện tại dùng mock data, backend API sẵn sàng khi cần switch
```
