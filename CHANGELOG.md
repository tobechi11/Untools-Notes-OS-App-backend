# Changelog

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
