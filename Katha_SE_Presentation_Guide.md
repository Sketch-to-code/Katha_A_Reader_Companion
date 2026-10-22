# Katha — Software Engineering Presentation Guide

> **Purpose of this document:** explain *how Katha was engineered*, not just what it does. Every section is framed in software-engineering terms (requirements, architecture, design principles, patterns, quality attributes, security, testing) so you can walk your professor through the reasoning behind the project.
>
> **How to use it:** read Sections 1–9 once tonight. Section 12 is your 10-minute talk track. Section 13 is likely Q&A. Section 14 lists small inconsistencies in your own docs to fix or be ready to explain.

---

## 0. The 30-second pitch (memorise this)

> "Katha is a web-based PDF reading companion. A user uploads a PDF to a private library, reads it with continuous scrolling, bookmarks and takes notes, and in Academic Mode can summarise, explain, translate, narrate, or chat with the book using AI. We built it as a **layered client–server system** — React SPA, Express API, a service layer, and Supabase for data and storage — with an **AI proxy boundary** so no provider secrets reach the browser. We applied **six GoF design patterns** and followed principles like separation of concerns, least privilege, and dependency inversion."

---

## 1. Problem statement and motivation

| Aspect | Description |
|---|---|
| **Problem** | PDFs are static. Students and readers must switch between a reader, a notes app, a translator and an AI chat tool. |
| **Goal** | One integrated environment: read → annotate → understand → listen. |
| **Users** | (1) Leisure readers of novels; (2) students / researchers reading dense material. |
| **Key idea** | Two **modes** over the same document: *Leisure* (distraction-free) and *Academic* (AI on standby). |

**SE framing:** this is a *user-centred* product with two user classes (actors), which drives the mode design.

---

## 2. Requirements engineering

### 2.1 Functional requirements (what the system does)

| ID | Requirement | Where it lives |
|---|---|---|
| FR1 | Register / sign in with email + password, or one-time code | Auth module, `login_challenges` table |
| FR2 | Upload, list, open, remove PDFs (≤ 50 MB) per user | Library, Supabase Storage |
| FR3 | Render PDF with continuous scroll, zoom, page navigation | `BookViewer.jsx` (PDF.js) |
| FR4 | Resume from last-read page | `documents` record + reading-progress events |
| FR5 | Bookmark pages; add and search notes | `bookmarks`, `notes` tables |
| FR6 | AI: summarise, explain, translate (Tamil, Spanish, French, Hindi, Arabic) | `AcademicModeFacade` + AI adapter |
| FR7 | Narrate a passage with pause / resume / stop | AI prep + browser Speech Synthesis |
| FR8 | Ask questions about the book (retrieval-augmented chat) | Backend retrieval + OpenRouter |
| FR9 | Background soundscapes with volume control | `BackgroundMusicContext` (Web Audio API) |
| FR10 | Themes (light / dark / sepia) and reading-mode preference | Settings |
| FR11 | Email notifications (login codes, study-session summary) | Resend |

### 2.2 Non-functional requirements (quality attributes)

| Quality attribute | How Katha addresses it |
|---|---|
| **Security** | Service-role key and API keys server-side only; JWT sessions; private storage bucket; signed URLs; per-user data isolation; ownership checks (server does not trust browser-supplied storage paths). |
| **Privacy** | PDFs private to the owner; retrieval for chat uses only the current user's PDF. |
| **Modifiability** | Adapter pattern lets you swap AI vendors without touching business logic; Strategy lets you add renderers. |
| **Maintainability** | Layered structure (routes → controllers → services → models); one responsibility per module. |
| **Usability** | Two modes, themes, resume-reading, explicit-play audio, clear error messages. |
| **Reliability / fail-fast** | Backend refuses to start if schema or storage-bucket checks fail; operations report errors rather than silently "succeeding". |
| **Portability** | Docker + Docker Compose; environment-variable configuration (12-factor style). |
| **Performance** | Canvas rendering per page; IntersectionObserver for page tracking; direct-to-storage uploads via signed URLs keep large files off the API server. |
| **Testability** | `USE_MOCK_AI` / Mock LLM adapter allows running without a paid provider. |

### 2.3 Constraints / assumptions

- Text-based PDFs only (OCR for scanned PDFs is future work).
- Internet needed for AI, email, and cloud storage.
- Narration uses the browser's voice, so quality varies by browser.

---

## 3. Development process (be honest and adapt this)

> ⚠️ I don't know exactly which process your course/team followed. The framing below is a safe, defensible description of how a two-person project like this naturally proceeds — **edit it to match what you actually did.**

**Suggested framing: Iterative–incremental development with a design-first document.**

1. **Analysis & design first** — a Software Design Document (`Katha_DA2_Software_Design_Document.docx`) defined architecture and patterns before coding.
2. **Incremental delivery** — the roadmap shows features added in increments: PDF rendering → scroll + page counter → text selection → resume → bookmarks/notes → modes → AI → translation → music → narration → RAG chat → email verification.
3. **Division of labour (separation of work along the architecture):**
   - **ARJUN** — backend (Express, Supabase, AI/TTS integration)
   - **ARUNADITYA RAGURAMAN** — frontend (React, PDF.js, UI/UX)
   - The API contract is the interface between the two halves.
4. **Configuration management** — Git repository, `.env.example` files, Docker for reproducible environments.

---

## 4. Architecture

### 4.1 Architectural style: layered client–server (n-tier)

```
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER  — React 18 SPA (Vite)                  │
│  Reader · Library · Notes · Settings · Auth · AI Panel      │
│  Contexts: Auth · Toast · BackgroundMusic · ReadingEvent    │
│  Strategies: renderStrategies (flipbook / scroll)           │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS / REST (Axios) + JWT
┌───────────────────────────▼─────────────────────────────────┐
│  APPLICATION / API LAYER — Node.js + Express                │
│  routes → middleware (auth, validation) → controllers       │
└───────────────────────────┬─────────────────────────────────┘
┌───────────────────────────▼─────────────────────────────────┐
│  SERVICE (BUSINESS) LAYER                                   │
│  AcademicModeFacade · aiProvider adapters ·                 │
│  events/readingProgressEmitter · factories (Cover, Soundscape)│
└───────────────────────────┬─────────────────────────────────┘
┌───────────────────────────▼─────────────────────────────────┐
│  DATA ACCESS LAYER — models + db/connection (Singleton)     │
└───────┬───────────────────────┬──────────────────┬──────────┘
        │                       │                  │
  ┌─────▼──────┐        ┌───────▼────────┐   ┌─────▼──────┐
  │ Supabase   │        │ OpenRouter     │   │ Resend     │
  │ Postgres + │        │ (LLM provider) │   │ (email)    │
  │ Storage    │        │                │   │            │
  └────────────┘        └────────────────┘   └────────────┘
        EXTERNAL SERVICES (all accessed only from the backend)
```

**Why this style?**
- **Separation of concerns:** each layer has one reason to change.
- **Replaceability:** the database, AI vendor, or email provider can change without rewriting the UI.
- **Security boundary:** the API tier is the only place that holds secrets.

### 4.2 The "AI proxy boundary" (key architectural decision)

The browser **never** talks to OpenRouter. It calls Katha's backend, which attaches credentials, builds the prompt, calls the provider, validates the output, and returns the result.

**Why:** protects API keys, lets us enforce per-user authorisation, control prompts/limits, and validate output (e.g., Tamil responses are checked to actually contain Tamil script).

### 4.3 Technology choices and rationale

| Choice | Rationale |
|---|---|
| **React 18 + Vite** | Component model fits Reader/Library/Notes; fast dev feedback. |
| **pdfjs-dist** | Canvas rendering + text layer = true text selection, no iframe clipping. |
| **Web Audio API** | Procedurally generated soundscapes — no audio files, no licensing, tiny bundle. |
| **Express** | Minimal, well-understood REST framework. |
| **Supabase Postgres + Storage** | Managed relational DB + private object storage in one platform. |
| **Custom JWT (not Supabase Auth)** | Full control over email-code flow; README states the app uses its own API-issued JWTs. |
| **OpenRouter** | One API to many models; model is configurable via `OPENROUTER_MODEL`. |
| **Resend** | Simple transactional email for login codes and summaries. |
| **Docker Compose** | Reproducible environment. |

---

## 5. Design principles applied

| Principle | Evidence in Katha |
|---|---|
| **Separation of Concerns** | UI / API / services / data are separate layers; PDF rendering is separate from AI logic. |
| **Single Responsibility (SRP)** | Each service does one job (cover creation, soundscape creation, event emission, AI call). |
| **Open/Closed (OCP)** | New AI provider = new adapter file; new renderer = new strategy entry. No edits to callers. |
| **Liskov Substitution (LSP)** | `OpenRouterAdapter` and `MockLLM` are interchangeable behind the `AIProvider` contract. |
| **Interface Segregation (ISP)** | The frontend sees one simple `assist(text, mode)`, not three services. |
| **Dependency Inversion (DIP)** | High-level code depends on the `AIProvider` abstraction, not a specific vendor. |
| **Least privilege / defence in depth** | Service-role key backend-only; private bucket; signed, short-lived URLs; ownership checks. |
| **Fail-fast** | Startup schema/bucket verification; explicit errors instead of silent fallbacks. |
| **12-factor config** | All secrets and endpoints from environment variables. |
| **DRY / Encapsulation** | Patterns hide vendor details and duplicated logic behind one entry point. |

---

## 6. Design patterns (GoF) — the core of your explanation

All six are listed in your README. For each: **problem → solution → where → benefit.**

### 6.1 Adapter *(structural)*
- **Problem:** Each LLM/TTS vendor has its own request/response format.
- **Solution:** Wrap each vendor in an adapter that implements one `AIProvider` contract.
- **Where:** `backend/services/aiProvider/*Adapter.js` (OpenRouter adapter, Mock LLM).
- **Benefit:** Swap vendors or switch to mock (`USE_MOCK_AI`) with zero changes to business logic. Supports OCP/DIP/LSP.

### 6.2 Facade *(structural)*
- **Problem:** Summarise, explain and translate are separate operations; callers would need to know all three services.
- **Solution:** One simplified entry point.
- **Where:** `backend/services/AcademicModeFacade.js` → `assist(text, mode)`.
- **Benefit:** Controllers stay thin; the subsystem can change internally. Reduces coupling.

### 6.3 Strategy *(behavioural)*
- **Problem:** The reader needs different visual rendering behaviours (flipbook vs. continuous scroll).
- **Solution:** Encapsulate each in an interchangeable class/component and select at runtime by mode.
- **Where:** `frontend/src/strategies/renderStrategies.jsx` mapping mode → `FlipbookRenderer` / `ScrollRenderer`.
- **Benefit:** Add a renderer without touching the reader. Avoids big `if/else` chains.

### 6.4 Observer *(behavioural)*
- **Problem:** Several parts of the system must react when the user changes pages (save progress, notify, update UI) without the page-turn code knowing about them.
- **Solution:** Publish/subscribe events.
- **Where:** `backend/services/events/readingProgressEmitter.js` and `frontend/src/context/ReadingEventContext.jsx`.
- **Benefit:** Loose coupling; new listeners need no change to the publisher.

### 6.5 Factory Method *(creational)*
- **Problem:** Creating covers and soundscapes involves variant-specific construction logic.
- **Solution:** Dedicated factories decide which concrete product to build.
- **Where:** `backend/services/factories/CoverFactory.js`, `SoundscapeFactory.js`.
- **Benefit:** Callers ask for "a cover" / "a soundscape" by type; new types are added in one place.

### 6.6 Singleton *(creational)*
- **Problem:** Many modules need the database client; creating many connections is wasteful and inconsistent.
- **Solution:** One shared instance.
- **Where:** `backend/db/connection.js`.
- **Benefit:** Single, shared, consistently configured client.

### Pattern summary table (put this on one slide)

| Category | Pattern | One-line purpose |
|---|---|---|
| Creational | Singleton | One shared DB connection |
| Creational | Factory Method | Build covers / soundscapes by type |
| Structural | Adapter | Uniform interface over AI vendors |
| Structural | Facade | One `assist()` call for summarise/explain/translate |
| Behavioural | Strategy | Swap reader rendering at runtime |
| Behavioural | Observer | React to reading-progress events |

> **If asked "why these patterns?"** — Because each solves a concrete problem in the project (vendor lock-in, subsystem complexity, runtime variation, event decoupling, object creation, shared resource) rather than being added for decoration.

---

## 7. Data design

### 7.1 Entities (Supabase Postgres)

| Table | Purpose | Key relationships |
|---|---|---|
| `users` | Accounts (name, email, password hash, verification state) | 1 user → many documents |
| `documents` | One row per uploaded PDF (title, storage path, last-read page, etc.) | belongs to user; 1 → many notes, bookmarks |
| `notes` | Text note attached to a page (and optionally a highlighted passage) | belongs to user + document |
| `bookmarks` | Saved page of a document | belongs to user + document |
| `login_challenges` | Short-lived one-time sign-in codes | belongs to user/email |

Plus a private **Storage bucket** `pdf-documents` for the files themselves.

### 7.2 Simple ER view

```
USERS 1 ───< DOCUMENTS 1 ───< NOTES
                    │
                    └───────< BOOKMARKS
USERS 1 ───< LOGIN_CHALLENGES
```

### 7.3 Data-integrity decisions
- Removing a document deletes its notes and bookmarks too (cascading behaviour described in the User Guide) and its stored PDF object.
- Schema is created by `backend/db/supabase-schema.sql` and **verified at startup**; mismatches stop the server rather than corrupting data.
- No MongoDB or in-memory fallback — one source of truth.

---

## 8. Key workflows (explain these as sequences)

### 8.1 Authentication with email one-time code

```
User → UI: email + password (+ name for new user)
UI → API: POST /auth/…
API → DB: create/lookup user, store hashed code in login_challenges
API → Resend: send six-digit code
User → UI: enters code
UI → API: verify code
API: validates challenge, issues JWT
UI: stores token; AuthContext attaches it to requests
```
**SE points:** email verification (identity assurance), short-lived challenge records, stateless JWT sessions, custom auth rather than Supabase Auth.

### 8.2 Secure PDF upload (signed-URL pattern)

```
UI → API: "I want to upload file X (≤ 50 MB)"
API: authenticates user, validates, creates document record
API → Supabase: create short-lived signed upload URL
API → UI: signed URL
UI → Supabase Storage: uploads PDF directly
```
**SE points:** large files bypass the API server (performance/scalability); credentials never reach the browser (security); downloads are also signed by the API.

### 8.3 Reading & progress (Observer in action)

```
User scrolls → IntersectionObserver detects visible page
→ page counter updates → ReadingEvent emitted
→ listeners: save last-read page, (study-session tracking)
```
**SE points:** IntersectionObserver instead of scroll-math (efficient); Observer pattern decouples UI from persistence.

### 8.4 AI assist (Facade + Adapter)

```
User selects text → clicks Summarize / Explain / Translate / Narrate
UI → API: POST /ai (text, mode, target language)
Controller → AcademicModeFacade.assist(text, mode)
Facade → AIProvider (Adapter: OpenRouter or Mock)
Adapter → OpenRouter → response
Facade: post-validates (e.g., Tamil script check) → returns
UI: shows result in conversation area
```

### 8.5 Retrieval-augmented book chat (RAG)

```
User asks a question
API: extracts/searches text from THIS user's PDF
API: selects matching passages (retrieval)
API → OpenRouter: question + retrieved context (augmented prompt)
Response grounded in the document → UI
```
**SE points:** grounding reduces hallucination; context is limited to the current user's own document (privacy). When the passage field is empty, extracted PDF text is used as context.

### 8.6 Narration

```
Passage → AI "prepare for speech" → text returned
→ browser SpeechSynthesis plays it
→ Pause / Resume / Stop controls
```
**SE points:** hybrid cloud + client approach; no server-side TTS cost required; depends on browser support (documented limitation). Background music is independent of narration.

### 8.7 Background music (Factory + Web Audio)
- `SoundscapeFactory` builds a procedurally generated soundscape (rain drip, cafe ambience, 40 Hz binaural beats, etc.) with the Web Audio API.
- `BackgroundMusicContext` provides global state, so music persists across pages.
- **Autoplay policy compliance:** audio starts only after a user interaction; never on page load. Selection and volume persist in the browser.

---

## 9. Security engineering

| Threat | Mitigation |
|---|---|
| Secret leakage (API keys) | Secrets only in backend `.env`; never in `VITE_` variables; AI proxy boundary. |
| Unauthorised data access | JWT auth middleware; every query scoped to the authenticated user; ownership checks before delete/download. |
| Path tampering | Server does **not** use a browser-supplied storage path to decide what to delete. |
| Account takeover | Email verification codes; password minimum length (8); hashed credentials; JWT secret ≥ 32 random chars. |
| Public file exposure | Private bucket; short-lived signed URLs. |
| Bad AI output | Output validation (e.g., Tamil-script check); errors shown rather than passed off as success. |
| Misconfiguration | Startup checks for schema and bucket; refuses to serve if invalid. |

> Mention: security was designed in from the start ("secure by design"), not patched later.

---

## 10. Verification, validation and testing

> ⚠️ Adapt this to what you actually tested. Don't claim automated tests you don't have.

**Safe things to say, supported by the project:**
- **Mock AI mode (`USE_MOCK_AI`)** — lets you test the full flow deterministically without a provider. This is a classic *test double* strategy enabled by the Adapter pattern.
- **Startup health checks** — schema and storage validation act as built-in sanity tests.
- **Manual functional testing** against the requirements table (FR1–FR11): sign-up/sign-in, wrong-password error, upload, resume, bookmarks, notes, each AI action, narration controls, mute/volume.
- **Negative testing:** wrong credentials, oversized/non-PDF upload, missing AI key, unsupported browser speech.

**Suggested test-case table for a slide (fill with your real results):**

| Test | Input | Expected | Result |
|---|---|---|---|
| Wrong password | invalid credentials | Error pop-up, red fields | ☐ |
| Upload >50 MB | large file | Rejected with message | ☐ |
| Resume | close & reopen book | Opens last page | ☐ |
| Translate to Tamil | English passage | Tamil-script output | ☐ |
| Remove book | confirm removal | PDF, notes, bookmarks deleted | ☐ |
| Mute music | select Mute | Silence immediately | ☐ |

---

## 11. Deployment, limitations and future work

**Deployment/DevOps:** Docker + Compose (frontend on port 3000, API on 8081 locally); env-based config; Supabase/Resend/OpenRouter as managed services.

**Known limitations (state them confidently — it shows maturity):**
- No OCR → scanned PDFs unsupported.
- AI quality/availability depends on provider and limits.
- Narration depends on the browser voice.
- Notifications depend on Resend domain verification for real users.

**Roadmap:** OCR for scanned PDFs · read-along synchronised-highlight narration · offline/PWA support · finalise full Docker Compose stack.

---

## 12. Suggested 10-minute talk track

| Time | Slide / topic | What to say |
|---|---|---|
| 0:00 | Title + pitch | Use the 30-second pitch in Section 0. |
| 0:45 | Problem & users | Static PDFs; two user types; two modes. |
| 1:45 | Requirements | A few key FRs; stress the NFRs (security, modifiability). |
| 3:00 | Architecture | Draw the layered diagram; explain the AI proxy boundary. |
| 4:30 | Design principles | Name 3–4 (SoC, SRP, OCP/DIP, least privilege) with examples. |
| 5:30 | Design patterns | Walk the six-pattern table; deep-dive Adapter and Facade. |
| 7:00 | Workflows | Pick two: secure upload and AI assist/RAG. |
| 8:00 | Data model & security | ER sketch; secrets/ownership/signed URLs. |
| 9:00 | Testing, limits, future | Be honest; mention OCR and read-along. |
| 9:30 | Live demo (optional) | Sign in → upload → read → summarise → narrate. |
| 10:00 | Close + questions | One-sentence recap. |

### Suggested demo order (3 minutes)
1. Sign in (show wrong-password error handling briefly).
2. Upload a PDF → open it, scroll, show the live page counter.
3. Bookmark + add a note.
4. Switch to Study with AI → select a passage → Summarize → Translate to Tamil.
5. Narrate → Pause → Resume → Stop.
6. Settings → pick Rain Drip → change theme.

---

## 13. Likely questions and strong answers

**Q1. Why a layered architecture instead of microservices?**
A: The system is small and developed by two people; a layered monolith gives clear separation of concerns with far less operational complexity. Layers keep it possible to split later.

**Q2. Why have a backend AI proxy? Why not call OpenRouter from React?**
A: Anything in the browser is public. A proxy keeps the key secret, allows authorisation and validation, and lets us change providers without redeploying clients.

**Q3. What happens if you change the AI vendor?**
A: Write one new adapter implementing `AIProvider` and select it in config. Facade, controllers and UI are untouched — that's the Open/Closed and Dependency Inversion principles.

**Q4. Why Facade? Isn't it just a function?**
A: It's a deliberate simplification boundary: callers use one `assist(text, mode)` instead of coordinating summarise/explain/translate services. Internals can change without ripples.

**Q5. Strategy vs. Adapter — what's the difference?**
A: Adapter makes an *incompatible* interface fit an expected one (vendor APIs → `AIProvider`). Strategy swaps *interchangeable algorithms* behind the same interface at runtime (flipbook vs. scroll).

**Q6. Where is Observer used and why?**
A: Page changes emit reading-progress events; interested parts (progress saving, session tracking) subscribe. The scroll code doesn't know who listens.

**Q7. Why signed URLs for upload?**
A: Files go straight to storage, so the API server isn't a bottleneck, and credentials aren't exposed. URLs are short-lived and issued only after authentication.

**Q8. Why custom JWT instead of Supabase Auth?**
A: Needed a custom email-code verification flow and full control over sessions; Supabase is used for data/storage only. The trade-off is that we own the security of the auth code.

**Q9. How do you prevent one user seeing another user's PDF?**
A: Private bucket, signed URLs, every query filtered by authenticated user, and server-side ownership checks.

**Q10. How does RAG work here and why use it?**
A: Relevant passages are retrieved from the current user's PDF and added to the prompt, grounding the answer in the document and reducing hallucination.

**Q11. How would it scale?**
A: Stateless JWT API → horizontal scaling behind a load balancer; managed DB/storage; uploads bypass the API; AI calls could be queued/rate-limited. Caching extracted text would cut repeated work.

**Q12. What are the limitations / what would you do next?**
A: OCR for scanned PDFs, read-along highlight narration, PWA/offline, automated test suite and CI.

**Q13. Which SE process model did you follow?**
A: Say what's true for you — e.g., design-document-first followed by iterative, incremental feature delivery (see Section 3).

**Q14. What is the Mock AI for?**
A: A test double behind the same interface: allows demos and testing without cost or network — a direct payoff of the Adapter pattern.

**Q15. Why Web Audio API instead of audio files?**
A: Procedural generation avoids licensing and large assets, and allows live volume control; the factory creates each soundscape type.

---

## 14. Things to double-check before presenting

These are small inconsistencies I noticed between your two docs. Better you find them than your professor.

1. **Docker Compose status:** the README lists "Docker Compose full stack" as *unchecked* on the roadmap, yet also recommends running with Docker. Say: "Docker setup exists for local development; the full-stack compose is still being finalised."
2. **Background music options:** README lists *Rain Drip, Cafe Ambience, Deep Focus Noise, 40 Hz Binaural Beats, Custom Audio upload, Mute*; the User Guide lists only *Rain Drip, 40 Hz Binaural Beats, Cafe Ambience, Mute*. Check the actual Settings screen and describe what is really there.
3. **Flipbook strategy:** README labels `FlipbookRenderer` / `ScrollRenderer` as "mock pages," so the Strategy pattern demonstrates the design but flipbook isn't a full feature. Describe it that way if asked.
4. **Mock vs. real AI:** README says AI uses OpenRouter when `USE_MOCK_AI=false`. Know which one you will run in the demo, and have the key configured.
5. **Text-selection toggle:** README mentions a Scroll vs. Select-text toggle; the User Guide doesn't. Confirm the current UI.
6. **Design document filename:** README references `Katha_DA2_Software_Design_Document.docx` — keep it handy; the professor may ask to see it.
7. **Email/AI in the demo:** have a backup (screenshots or a short screen recording) in case the network, Resend or OpenRouter fails during the presentation.

---

## 15. One-slide cheat-sheet (final recap)

- **What:** AI-assisted PDF reader — Leisure & Academic modes.
- **Architecture:** Layered client–server; React → Express → services → Supabase; external OpenRouter & Resend.
- **Key decision:** AI proxy boundary + backend-only secrets.
- **Patterns (6):** Adapter, Facade, Strategy, Observer, Factory Method, Singleton.
- **Principles:** SoC, SRP, OCP, DIP, least privilege, fail-fast, 12-factor.
- **Security:** JWT + email verification, private bucket, signed URLs, ownership checks.
- **Quality:** modifiable, secure, testable (mock AI), portable (Docker).
- **Future:** OCR, read-along narration, PWA, automated tests.
