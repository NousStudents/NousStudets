# Security Implementation Plan (OWASP-Aligned)

Use this plan to harden the NestJS backend before Step 5 frontend integration.

## Scope

- Backend: NestJS API
- Database: Neon Postgres
- Frontend: no changes unless token storage needs updates

## Priority Order

1) Rate limiting  
2) Security headers (Helmet)  
3) Refresh token rotation + revoke  
4) Password policy enforcement  
5) CORS hardening  
6) Audit logging  

---

## 1) Rate Limiting (Critical)

Goal: prevent brute-force login and abusive traffic.

Implementation:
- Install `@nestjs/throttler` (and optional Redis store if needed later).
- Add `ThrottlerModule` globally.
- Apply stricter throttles to auth endpoints.

Recommended limits:
- Global: 100 requests / 60s per IP  
- Login: 5 requests / 60s per IP  
- Register: 5 requests / 300s per IP  

Notes:
- If behind a proxy, add `app.set('trust proxy', 1)` in `main.ts`.
- Use `@Throttle` on `/auth/login` and `/auth/register`.

---

## 2) Helmet (Security Headers)

Goal: prevent common XSS, clickjacking, and MIME sniffing.

Implementation:
- Install `helmet`.
- Add `app.use(helmet())` in `main.ts`.
- If CSP causes issues, disable CSP for now and add later.

---

## 3) Refresh Token Rotation + Revoke (Critical)

Goal: prevent stolen refresh tokens from remaining valid.

Implementation:
- Add a new table/model: `auth_refresh_tokens`
  - Fields: `id`, `auth_user_id`, `token_hash`, `created_at`, `expires_at`, `revoked_at`, `replaced_by`
- On login:
  - generate refresh token
  - hash it (bcrypt or sha256)
  - store in DB
- On refresh:
  - verify token exists and not revoked
  - revoke old token
  - issue new refresh token (rotation)
- On logout:
  - revoke current refresh token

Deliverables:
- Prisma model for refresh tokens
- Updated `AuthService.refreshToken()` and `logout()`

---

## 4) Password Policy Enforcement

Goal: enforce OWASP password strength at the API level.

Minimum rules:
- min length: 8
- at least 1 uppercase
- at least 1 lowercase
- at least 1 number
- at least 1 special character

Implementation:
- Add `class-validator` decorators on DTOs
- Validate in register and change-password endpoints

---

## 5) CORS Hardening

Goal: prevent unwanted origins in production.

Implementation:
- Use `CORS_ORIGINS` env var in `main.ts`
- In production, only allow known frontend domains
- Keep localhost for dev

---

## 6) Audit Logging (Admin Actions)

Goal: trace sensitive actions.

Scope:
- Admin actions: create/update/delete users, students, teachers, classes
- Log to `audit_logs` table (already exists in SQL)

Implementation:
- Add `AuditService`
- Call `auditService.log()` after admin mutations

---

## Verification Checklist

1) Login rate limited after 5 attempts / 60s  
2) Refresh token rotation: old refresh token rejected  
3) JWT-protected routes block missing/invalid tokens  
4) Password policy enforced on register  
5) Helmet headers present  
6) Audit logs created on admin CRUD  
