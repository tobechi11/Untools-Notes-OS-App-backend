# Changelog

## 0.8.0 — 2026-03-20

Real-time streaming dictation via OpenAI Realtime API.

- POST /api/realtime/session endpoint mints ephemeral tokens for browser WebSocket auth
- Browser mic audio streamed via AudioWorklet (PCM16 24kHz) directly to OpenAI Realtime API
- Progressive text insertion into TipTap editor as user speaks
- Server VAD detects speech turns; model responses cancelled (transcription-only mode)
- Dictation button shows animated teal audio bars that react to mic volume
- Realtime model names configurable via OPENAI_REALTIME_MODEL and OPENAI_REALTIME_TRANSCRIPTION_MODEL env vars
- Old Whisper-based transcribe endpoint preserved as fallback

## 0.7.0 — 2026-03-19

Accordion structured nodes support and enriched seed data.

- Node extractor updated for dual-format support: reads nested `child.content` for new block-accordion nodes, falls back to sibling text for legacy inline atoms
- Seed data rewritten with `snode()` helper producing block-level structuredNodes with bulletList content
- Each seed node now contains meaningful bullet points inside the accordion body
- Seed memos use headings, paragraphs, and bullet lists between accordion nodes for richer document structure

## 0.6.0 — 2026-03-18

AI chat persistence, model routing, refined prompts, and expanded seed data.

- AiChatMessage table for persisting AI sidebar conversations per memo
- GET /ai/chat/history/:memoId, POST /ai/chat/save, DELETE /ai/chat/history/:memoId endpoints
- Memo ownership verification on all chat history endpoints
- Auto model selection uses gpt-4.1-mini; Claude and GPT-5 remain explicit choices
- System prompt updated with full-memo context fallback (no selection → entire memo)
- Tone rules: no filler phrases, no preamble, direct output only
- Typed Hono context for userId/userEmail (fixes TS redlines)
- Prisma client import from generated path (fixes driver adapter type resolution)
- Expanded seed data: 6 realistic memos with detailed structured nodes, mental models, and tags

## 0.5.0 — 2026-03-17

AI dictation via OpenAI Whisper.

- POST /api/transcribe endpoint accepts audio file (FormData), returns transcribed text
- Uses OpenAI Whisper API with configurable model via OPENAI_WHISPER_MODEL env var
- Protected by auth middleware
- Added openai SDK dependency

## 0.4.1 — 2026-03-17

Email service migrated from Brevo API key to SMTP.

- Replaced Brevo transactional API with nodemailer SMTP transport
- Configurable via BREVO_SMTP_HOST, BREVO_SMTP_PORT, BREVO_SMTP_USER, BREVO_SMTP_PASS
- BREVO_SENDER_EMAIL and BREVO_SENDER_NAME for from address
- OTP verification and password reset emails sent via SMTP

## 0.4.0 — 2026-03-10

Delete support, seed API, and node extraction fix.

- DELETE /tags/:name endpoint to remove tags by name (with OpenAPI spec)
- POST /api/seed public endpoint to auto-populate sample data for all users
- Fixed structured node content extraction for TipTap atom nodes (sibling text)
- Seed data uses correct TipTap JSON structure for atom structured nodes

## 0.3.1 — 2026-03-09

Admin & debugging endpoints.

- List all users endpoint (GET /auth/users) with email verified status, memo/tag counts
- Delete user by ID endpoint (DELETE /auth/user/:id)
- Test email endpoint (POST /test-email, no auth) for Brevo debugging
- Improved email service logging and env var trimming

## 0.3.0 — 2026-03-09

Email verification and forgot password.

- 6-digit OTP email verification on registration (via Brevo)
- Login blocked until email is verified (403 + needsVerification flag)
- Resend verification code endpoint
- Forgot password flow with OTP code
- Reset password endpoint
- Delete user endpoint (accessible via Scalar API docs)
- OtpCode model with expiry and used tracking
- Updated OpenAPI spec with all new auth endpoints

## 0.2.0 — 2026-03-09

Email + password authentication.

- User model with bcrypt password hashing
- Register, login, and me endpoints under /api/auth
- JWT Bearer auth middleware on all protected routes
- All data scoped to authenticated user (no more hardcoded default-user)
- Scalar API docs with Bearer security scheme at /docs
- Seed creates demo user (demo@example.com / demo1234)

## 0.1.0 — 2026-03-09

Initial backend implementation.

- Bun + Hono REST API with Prisma 7 and PostgreSQL
- Full CRUD for memos with structured node extraction
- Dashboard endpoints querying nodes/tags tables directly
- Tag management with upsert and memo-tag linking
- Docker Compose setup for full-stack development
- Seed script with sample memos and tags
