# Katha — A Reader's Companion 📖

> Turn any PDF into an immersive, AI-assisted reading experience.

Katha transforms static PDF documents — textbooks, research papers, novels — into an interactive, book-like reading experience. Read leisurely with continuous-scroll HiDPI PDF rendering and ambient soundscapes, or switch to Academic Mode where an AI assistant summarizes, explains, and translates content on demand.

---

## ✨ Features

### Core Reading Experience
- 📄 **HiDPI Canvas Rendering** — Renders canvases scaled to `window.devicePixelRatio` for razor-sharp typography and diagram clarity on high-DPI and Retina displays.
- 📜 **Continuous Virtualized Scroll** — Scroll through all pages in one fluid view; intersection observers update the live page counter with zero lag.
- ✎ **Continuous Text Selection** — Full integration with PDF.js `TextLayer` and official CSS custom variable chaining (`--total-scale-factor`), enabling continuous, smooth line highlighting (identical to Acrobat/Edge).
- 🔍 **Interactive Zoom Controls** — In-reader `−`, `100% / Reset`, and `+` zoom controls (40%–200%) with horizontal panning support.
- 🖼️ **Auto-Generated Cover Pages** — Factory method (`CoverFactory`) automatically extracts embedded PDF covers or dynamically generates an aesthetic cover if none is present.
- 🔖 **Bookmarks** — Save, toggle, and jump back to any page with immediate database persistence per user.
- 📝 **Notes with Context Capture** — Attach written notes to specific pages; highlighted PDF text automatically flows into note drafts.
- ⏯️ **Resume Reading** — Automatically persists and resumes reading progress from your exact last-read page.
- 🎨 **Visual Themes** — Light, Dark, and Warm Sepia themes with full color-token harmonization.
- 🎵 **Ambient Soundscapes** — Web Audio soundscape engine (Rain Drip, Cafe Ambience, Deep Focus Noise, 40 Hz Binaural Beats, or Custom Audio upload) with volume controls (explicit user trigger — no autoplay).

### Reading Modes
- 🌿 **Leisure Mode** — Clean, distraction-free reading interface for casual reading and literature.
- 🎓 **Academic Mode** — Docked two-column workspace pairing your document with an interactive AI study companion.
- ⚡ **Dynamic Responsive Resizing** — Real-time `ResizeObserver` callback ref dynamically scales the PDF canvas to fit available width when toggling Academic Mode.

### AI Features (Academic Mode)
- 🧠 **Summarize** — Instant, bulleted conceptual summaries grounded in selected text.
- 💡 **Explain Simply** — Plain-language breakdowns with clear definitions of core software and academic terminology.
- 🌐 **Google Neural Machine Translation** — Dedicated zero-config machine translation engine for Tamil, Hindi, Spanish, French, and Arabic.
- 💬 **Unified Chatbot Interface** — Simplified single-input chat flow with an active context pill (`📖 Selected Passage`) and contextual document Q&A.
- 🔊 **Narration** — Read-aloud narration powered by browser speech synthesis with Play, Pause, Resume, and Stop controls.
- 🛡️ **Multi-Model Auto-Fallback** — Resilient AI architecture supporting free OpenRouter models (`nvidia/nemotron-3.5-super-vl:free`, `google/gemma-4-26b-a4b-it:free`) with graceful fallback.

---

## 🛠️ Tech Stack

**Frontend**
- React 18 (Vite)
- [pdfjs-dist v6](https://mozilla.github.io/pdf.js/) — Canvas rendering, TextLayer selection, `IntersectionObserver` page tracking
- Web Audio API — Procedural ambient soundscapes and custom audio streaming
- Axios with interceptor-based JWT management

**Backend**
- Node.js (v20+) + Express
- Supabase (PostgreSQL + S3-compatible private PDF Storage)
- JWT authentication with secure salt-hashed password and challenge verification
- IPv4-first DNS resolution (`dns.setDefaultResultOrder('ipv4first')`) to prevent network hangs

**AI & Translation Layer**
- OpenRouter API (Free models with zero-reasoning direct formatting)
- Google Neural Machine Translation API integration
- Retrieval-Augmented Generation (RAG) for document-wide question answering

**Quality & Testing**
- Native Node.js test runner (`node --test`)
- Stryker Mutator for mutation testing analysis
- Docker + Docker Compose

---

## 📂 Project Structure

```
katha/
├── frontend/                        # React SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── Reader/
│   │   │   │   ├── BookViewer.jsx   # HiDPI canvas viewer + text layer + zoom controls
│   │   │   │   ├── AIPanel.jsx      # Unified single-input AI companion
│   │   │   │   ├── FlipbookRenderer.jsx  # Strategy: flipbook renderer
│   │   │   │   └── ScrollRenderer.jsx    # Strategy: continuous scroll renderer
│   │   │   ├── Layout/
│   │   │   │   └── Sidebar.jsx      # Collapsible navigation with vector SVG icons
│   │   │   ├── Auth/
│   │   │   ├── Notes/
│   │   │   └── Settings/
│   │   ├── context/
│   │   │   ├── BackgroundMusicContext.jsx # Web Audio ambient soundscapes
│   │   │   ├── AuthContext.jsx
│   │   │   └── ToastContext.jsx
│   │   └── strategies/
│   │       └── renderStrategies.jsx # Strategy pattern: maps mode → renderer
│   └── tests/
│       └── ui.test.js               # Frontend unit test suite
├── backend/                         # Express API
│   ├── controllers/
│   ├── db/                          # Supabase client singleton & SQL schema
│   ├── middleware/                  # JWT auth, rate limiter, error handler
│   ├── services/
│   │   ├── aiProvider/              # Adapter: OpenRouter, Google Translate, Mock LLM
│   │   ├── events/                  # Observer: readingProgressEmitter
│   │   ├── factories/               # Factory Method: CoverFactory, SoundscapeFactory
│   │   └── AcademicModeFacade.js    # Facade: unified assist API
│   ├── tests/                       # 66 backend unit & integration tests
│   └── stryker.conf.json            # Mutation testing configuration
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ installed
- A free [Supabase](https://supabase.com) project
- An [OpenRouter](https://openrouter.ai) API key (free tier supported)

### Local Setup

```bash
# 1. Clone repository
git clone https://github.com/Sketch-to-code/Katha_A_Reader_Companion.git
cd katha

# 2. Configure Backend
cd backend
cp .env.example .env
# Edit backend/.env with your Supabase, JWT, and OpenRouter credentials

# 3. Install dependencies & run backend
npm install
npm run dev

# 4. Configure & run Frontend (in a new terminal)
cd ../frontend
npm install
npm run dev
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8081](http://localhost:8081)

---

## 🧪 Testing & Quality Assurance

Katha includes an automated test suite across the frontend and backend:

```bash
# Run all backend unit & integration tests (66 tests)
cd backend
npm test

# Run frontend test suite (4 tests)
cd frontend
npm test

# Run Stryker mutation testing
cd backend
npm run test:mutation
```

### Test Coverage Highlights:
- **Authentication & Security:** JWT verification, tamper detection, token expiry, bcrypt hashing.
- **Service Layer:** `bookmarkService`, `noteService`, `CoverFactory`, `SoundscapeFactory`.
- **AI & Translation:** `AcademicModeFacade`, `OpenRouterAdapter`, `googleTranslate`, RAG document search.
- **Middleware:** `rateLimiter` (sliding window), `authMiddleware`.
- **Events:** `readingProgressEmitter` (Observer singleton).

---

## 🧩 Environment Variables

Configure `backend/.env` with the following variables:

| Variable | Description | Default / Example |
|---|---|---|
| `PORT` | Backend TCP listening port | `8081` |
| `JWT_SECRET` | Secret key for signing session tokens (min 32 chars) | Random 64-char string |
| `SUPABASE_URL` | Supabase project URL | `https://<ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend service-role key (never expose to client) | Service key |
| `PDF_BUCKET` | Supabase storage bucket name for PDFs | `pdf-documents` |
| `OPENROUTER_API_KEY` | OpenRouter API Key | `sk-or-v1-...` |
| `OPENROUTER_MODEL` | AI model identifier (supports 100% free models) | `nvidia/nemotron-3.5-super-vl:free` |
| `USE_MOCK_AI` | Set to `false` for real AI, `true` for offline mock | `false` |
| `USE_GOOGLE_TRANSLATE` | Set to `true` for Google Neural Translation | `true` |
| `RESEND_API_KEY` | Resend email API key for login codes & session emails | `re_...` |
| `RESEND_FROM_EMAIL` | Verified sender email | `Katha <onboarding@resend.dev>` |

---

## 🧱 Software Engineering Design Patterns

Katha implements 6 classic Gang of Four (GoF) design patterns:

| Pattern | Implementation Location | Architectural Role |
|---|---|---|
| **Adapter** | `backend/services/aiProvider/*` | Wraps heterogeneous AI vendors (OpenRouter, Google Translate, Mock LLM) behind a standard `AIProvider` contract. |
| **Facade** | `backend/services/AcademicModeFacade.js` | Simplifies complex subsystem calls (summarize, explain, ask, translate, narrate) into a single unified `assist()` API. |
| **Strategy** | `frontend/src/strategies/renderStrategies.jsx` | Encapsulates rendering algorithms (`ScrollRenderer` vs `FlipbookRenderer`), allowing dynamic runtime switching. |
| **Observer** | `backend/services/events/readingProgressEmitter.js` | Decouples reading progress tracking and milestone events from database handlers. |
| **Factory Method** | `backend/services/factories/CoverFactory.js`, `SoundscapeFactory.js` | Encapsulates instantiation logic for cover extractions and ambient audio tracks. |
| **Singleton** | `backend/db/connection.js` | Enforces a single shared connection pool to Supabase PostgreSQL throughout the lifecycle. |

---

## 👥 Contributors

- **ARUNADITYA RAGURAMAN** — Frontend Architecture (React, PDF.js, UI/UX, HiDPI Canvas & Selection)
- **ARJUN** — Backend Architecture (Express, Supabase, AI/TTS Integration, Design Patterns)

---

## 📄 Academic Coursework

This project is developed as part of the **V Semester Software Engineering (DA3 / Review 3)** course curriculum at VIT University.
