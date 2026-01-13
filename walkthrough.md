# Walkthrough: Backend Migration & Frontend Integration

## Overview

We have successfully migrated the core authentication flow and school selection from Supabase to the new NestJS backend. This includes creating new API endpoints, refactoring the frontend Auth Context, and ensuring strict type safety and tenant isolation.

## Changes Implemented

### Backend (NestJS)

- **New Endpoints**:
  - `GET /schools`: **Public endpoint** allowing unauthenticated access for the login school selector.
  - `GET /auth/me`: **Protected endpoint** returning a comprehensive user profile, including role-specific data (e.g., student details) and school info.
  - `POST /auth/register/{role}`: Role-specific registration endpoints for `student`, `teacher`, and `parent`.
- **Role Management**:
  - Updated `AuthService` to validte and assign roles dynamically.
  - Added `getUserProfile` to fetch related profile data efficiently.
- **DTOs**:
  - Aligned `RegisterDto` and `AuthResponse` with frontend expectations.

### Frontend (React)

- **Auth Context**:
  - Completely removed Supabase dependency for session management.
  - Implemented `checkAuth` using `authService.getProfile()` to restore sessions via JWT.
  - Added backward compatibility for `session` object to prevent breaking legacy components.
- **Components**:
  - **Login (`Auth.tsx`)**: Now fetches the school list from the public NestJS API (`/schools`) and passes `schoolId` during login.
  - **Register**: Uses `authService.register` with the specific role and school context.
- **Services**:
  - `auth.service.ts`: Updated `UserProfile` interface to match the full backend response (added `fullName`, `avatar`, etc.).
  - `api.ts`: Configured Axios interceptors to automatically attach the `accessToken`.

## Verification Steps

### 1. Backend Setup (Critical)

Before testing, you **MUST** sync the Prisma Client with the Schema, as we added new enums and fields.

```bash
cd backend
# Ensure backend/.env contains your valid DATABASE_URL
npx prisma generate
npm run start:dev
```

> **Note:** If you encounter type errors about `AppRole` or missing User fields, `prisma generate` will resolve them.

### 2. Frontend Test

```bash
# In the root 'NousStudets' directory
npm run dev
```

1. **Login Screen**: Verify that the "Select School" dropdown populates from the API.
2. **Registration**: Try registering a new Student. It should succeed and log you in.
3. **Persistence**: Refresh the page. You should remain logged in (via `checkAuth` + local storage token).
4. **Role Check**: Verify that the dashboard correctly identifies you as a Student (via `useRole` hook).

## Next Steps

- Continue implementing role-specific dashboards (Teacher, Parent).
- Migrate remaining specific Supabase calls (e.g., `GET /students`, `GET /classes`) to NestJS.
