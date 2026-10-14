# Katha — A Reader's Companion 📖

> Turn any PDF into an immersive, AI-assisted reading experience.

Katha transforms static PDF documents — novels, textbooks, research papers — into an interactive, book-like reading experience. Read leisurely with a flippable book UI and ambient soundscapes, or switch to Academic Mode where an AI assistant summarizes, explains, and narrates content on demand.

---

## ✨ Features

### Core Reading Experience
- 📖 **Flippable book UI** — PDFs rendered as a realistic page-turning book (toggle to continuous scroll mode)
- 🔍 **Zoom controls** — auto-fit on load, manual zoom in/out
- 🖼️ **Auto-generated cover page** — automatically creates a cover with the document title when the source PDF doesn't have one
- 🔖 **Bookmarks** — save and jump back to any page, persisted per user
- 📝 **Notes** — attach written notes to specific pages or highlighted passages
- ⏯️ **Resume reading** — automatically picks up where you left off
- 🎨 **Themes** — light/dark/sepia visual themes
- 🎵 **Ambient soundscapes** — manually select background audio (rain, ocean, forest, lo-fi, etc.) to set the mood while reading

### Reading Modes
- 🌿 **Leisure Mode** — a clean, distraction-free interface for novels and casual reading
- 🎓 **Academic Mode** — keeps an AI assistant on standby for study material

### AI Features (Academic Mode)
- 🧠 **Summarize** — highlight any passage and get a concise AI-generated summary
- 💡 **Explain Simply** — highlight dense or technical text and get a plain-language explanation
- 🔊 **AI Chapter Narration (TTS)** — request AI-generated audio narration of the current page or a selected passage, so you can listen instead of read

---

## 🛠️ Tech Stack

**Frontend**
- React (Vite)
- Supabase signed uploads and private PDF viewing
- Axios

**Backend**
- Node.js + Express
- Supabase Postgres + Storage
- JWT sessions with email verification

**AI Layer**
- OpenRouter summarization, explanation, and retrieval-augmented book chat via a secure backend proxy
- Text-to-Speech API for on-demand chapter/passage narration

**DevOps**
- Docker + Docker Compose for local development

---

## 📂 Project Structure

```
katha/
├── frontend/          # React app (PDF rendering, flipbook UI, AI panel)
├── backend/           # Express API (auth, bookmarks, notes, AI proxy, TTS proxy)
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── services/      # AI summarization + TTS integration
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Node.js 22+ (optional, only needed for non-Docker local dev)
- A Supabase project with the backend service-role key
- An LLM API key (for summarize/explain)
- A TTS API key (for chapter narration)

### Run with Docker (recommended)

```bash
git clone <repository-url>
cd katha
cp backend/.env.example backend/.env
# fill in Supabase, Resend, JWT, and OpenRouter settings in backend/.env
docker-compose up --build
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8081](http://localhost:8081)

### Run without Docker

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

---

## 🧩 Environment Variables

Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env.local`. Configure the backend service credentials before using cloud features:

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend-only key for Postgres and signed Storage URLs; never expose it in the frontend |
| `RESEND_API_KEY` | Backend-only key used for login and activity notifications |
| `RESEND_FROM_EMAIL` | Sender address verified with Resend |
| `OPENROUTER_API_KEY` | Backend-only key used for AI |
| `OPENROUTER_MODEL` | OpenRouter chat model identifier |
| `JWT_SECRET` | Secret used to sign auth tokens |
| `VITE_API_BASE_URL` | Backend URL used by the frontend |

---

## 🧱 Software Design

This repo implements the design from `Katha_DA2_Software_Design_Document.docx`: a layered client-server architecture (React SPA → Express API → service layer → Supabase) with an AI proxy boundary that keeps provider credentials off the client. Six GoF patterns are applied directly in the code:

| Pattern | Where |
|---|---|
| Adapter | `backend/services/aiProvider/*Adapter.js` — vendor-specific LLM/TTS calls behind one `AIProvider` contract |
| Facade | `backend/services/AcademicModeFacade.js` — one `assist(text, mode)` call instead of three services |
| Strategy | `frontend/src/strategies/renderStrategies.jsx` — flipbook vs. scroll renderer, swapped at runtime |
| Observer | `backend/services/events/readingProgressEmitter.js` and `frontend/src/context/ReadingEventContext.jsx` |
| Factory Method | `backend/services/factories/CoverFactory.js`, `SoundscapeFactory.js` |
| Singleton | `backend/db/connection.js` |

All persisted account, document, note, bookmark, and login-challenge data use Supabase. There is no MongoDB or in-memory persistence fallback.

AI uses OpenRouter when `USE_MOCK_AI=false`; set `OPENROUTER_API_KEY` in the backend environment to enable responses. The database and private file storage use Supabase, while mail notifications use Resend; follow the setup section below before using cloud features.

## 🚀 Quick Start — Local Development

```bash
git clone <repository-url>
cd katha
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Backend
cd backend && npm install && npm run dev   # http://localhost:8081

# Frontend (new terminal)
cd frontend && npm install && npm run dev  # http://localhost:3000
```

Or with Docker: `docker-compose up --build`.

## 🗺️ Roadmap

- [x] PDF upload + flipbook rendering
- [x] Bookmarks & auto-cover generation
- [x] Book- and page-associated notes
- [x] Zoom controls
- [x] Leisure / Academic mode toggle
- [x] AI summarize & explain
- [x] OpenRouter retrieval-augmented PDF chat
- [x] Email login verification and activity notifications
- [ ] AI chapter narration (TTS)
- [ ] Docker Compose full stack
- [ ] OCR support for scanned PDFs *(future)*
- [ ] Read-along synced-highlight narration *(future)*
- [ ] Offline/PWA support *(future)*

---

## 👥 Contributors

- **ARJUN** — Backend (Express, Supabase, AI/TTS integration)
- **ARUNADITYA RAGURAMAN** — Frontend (React, PDF.js, UI/UX)

---

## 📄 License

This project is developed as part of an academic Software Engineering course assignment.

## Supabase, Resend, and OpenRouter setup

1. In the Supabase dashboard, open **SQL Editor → New query**, paste all of `backend/db/supabase-schema.sql`, and run it. It creates the `users`, `documents`, `notes`, `bookmarks`, and `login_challenges` tables plus a private `pdf-documents` Storage bucket. The script does not drop or rename existing tables. `CREATE TABLE IF NOT EXISTS` will not alter a pre-existing incompatible table; the backend checks required columns at startup and refuses to serve requests with a clear error if they do not match. Do not drop/rename old `profiles`, `books`, `notes`, or `bookmarks` tables to silence a mismatch; inspect and back up the actual schema first.
2. Copy `backend/.env.example` to `backend/.env`. Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `PDF_BUCKET` (normally `pdf-documents`) from your project settings/configuration. Keep the service-role key on the backend only; never put it in a `VITE_` variable, commit it, or share it.
3. Set a unique, long random `JWT_SECRET` in `backend/.env`. The app uses its own API-issued JWTs; it does not use Supabase Auth for login or table policies.
4. Configure Resend in `backend/.env` with `RESEND_API_KEY` and a sender address allowed by your Resend account. Email login codes cannot be delivered until this is configured. For real users, verify your sending domain with Resend.
5. Copy `frontend/.env.example` to `frontend/.env.local` and set `VITE_API_BASE_URL` to the API URL (locally, `http://localhost:8081/api`). The browser uploads PDFs with short-lived signed URLs from the API; private PDF downloads are signed by the API too.
6. Start the backend with `cd backend` then `npm install` and `npm run dev`; in another terminal start the frontend with `cd frontend` then `npm install` and `npm run dev`.

Set `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` in the backend environment to enable the AI assistant. Book chat retrieves matching text from the current user's PDF before sending context to OpenRouter. Keep Supabase, Resend, OpenRouter, and JWT secrets server-side. The backend will not start unless Supabase schema and private Storage bucket checks pass.
