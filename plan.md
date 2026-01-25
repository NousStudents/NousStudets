# Backend Replacement Plan (Supabase -> NestJS)

## Step 1: Inventory Supabase Usage + Map to New API

### Goal

Build a complete map of all Supabase calls in the frontend so the NestJS API matches existing behavior and no flows are missed.

### Deliverable

A mapping table with columns:
`Location`, `Supabase call`, `Purpose`, `Required REST endpoint`, `Auth required?`, `Role(s)`, `Tenant scope (school_id)`.

### High-level tasks

1. Find every Supabase call in the frontend and edge functions.
2. Group them by feature: auth, roles, schools, students, teachers, parents, classes, attendance, assignments, exams, fees, messaging, AI tools.
3. Translate each Supabase call into a REST endpoint requirement.
4. Mark security requirements (auth, roles, tenant scoping).

### Low-level instructions

1. Search the frontend for Supabase usage:
   - `supabase.auth.*`
   - `supabase.rpc(...)`
   - `supabase.from(...).select/insert/update/delete`
   - `supabase.functions.invoke(...)`
   - Command: `rg "supabase\.(auth|from|rpc|functions)" src`
2. For each file found, record:
   - Table or function name
   - Action type (select/insert/update/delete)
   - Filters used (especially `school_id`, `auth_user_id`)
   - Expected roles (admin/teacher/student/parent)
3. Capture auth flows:
   - `src/contexts/AuthContext.tsx`
   - `src/pages/Auth.tsx`
4. Capture role resolution:
   - `src/hooks/useRole.ts`
5. Capture tenancy behavior:
   - `src/contexts/TenantContext.tsx`
   - `src/utils/tenantSupabase.ts`
6. Scan Supabase edge functions:
   - `supabase/functions/*`
   - Map each function to a REST endpoint.
7. Build the mapping table.
   - Example row:
     - `src/pages/Auth.tsx` | `supabase.functions.invoke('student-signup')` | public student signup | `POST /signup/student` | public | student | `school_id` in body

### Security notes to record per entry

- Public vs authenticated
- Allowed roles
- Tenant scope requirement and where `school_id` comes from

---

## Step 2: Refactor Authentication & Frontend Integration

### Goal

Replace Supabase Auth in the frontend with valid JWT-based authentication using the new NestJS backend. Ensure seamless login, token storage, and session restoration.

### Deliverables

1. **Refactored `AuthContext.tsx`**: Uses `api` client instead of `supabase.auth`.
2. **Auth Service**: Dedicated `auth.service.ts` for handling API calls.
3. **Token Management**: Secure storage and automatic header injection.
4. **Login Flow**: Functional login page using new backend.

### High-level tasks

1. **Create Auth Service**: Abstract all auth API calls (login, logout, me, refresh).
2. **Refactor AuthContext**:
    - Remove `supabase.auth` listeners.
    - Implement `login` function calling `AuthService.login`.
    - Implement `logout` function clearing tokens.
    - Implement `initialize` check to restore session from token.
3. **Update `api.ts` Interceptors**: Ensure 401s are handled and tokens injected.
4. **Refactor Login Component**: specific updates to `src/pages/Auth.tsx` to use the new context methods.
5. **Refactor `useRole`**: Stop calling RPC; derive role from AuthContext user object.

### Low-level instructions

1. **Create `src/services/auth.service.ts`**:

    ```typescript
    export const authService = {
      login: (creds) => api.post('/auth/login', creds),
      register: (data) => api.post('/auth/register', data),
      getProfile: () => api.get('/auth/me'),
      logout: () => api.post('/auth/logout'),
    }
    ```

2. **Modify `AuthContext.tsx`**:
    - State: `user`, `loading`, `isAuthenticated`.
    - `useEffect`: On mount, check if `accessToken` exists in localStorage.
        - If yes, call `api.get('/auth/me')` to validate and get user details.
        - If 401, clear token and logout.
    - `signIn`: Call `authService.login`, save tokens to localStorage, set user state.
    - `signOut`: Call `authService.logout`, clear localStorage, reset state.
3. **Update `src/lib/api.ts`**:
    - Ensure `Authorization: Bearer <token>` is added from localStorage.
4. **Security Checks**:
    - Ensure `schoolId` is passed during login if required.
    - Verify role matches selected role in UI.

---

## Step 3: Align Backend to Source-of-Truth SQL Schema

### Goal

Treat `backend/database-schema.sql` as the source of truth and align the NestJS backend (Prisma + services) to match it. The objective is to replace Supabase services without changing the data model.

### Deliverables

1. **Prisma schema updated** to match `database-schema.sql` tables/fields/relations.
2. **Neon DB initialized** with the same schema.
3. **Auth + profile queries** updated to use `auth_user_id` and table names in the SQL schema.

### High-level tasks

1. Convert `backend/database-schema.sql` into Prisma models.
2. Initialize Neon with the SQL schema.
3. Regenerate Prisma client and fix backend service queries.

### Low-level instructions

1. **Prisma schema sync**
   - Replace/extend `backend/prisma/schema.prisma` to mirror SQL:
     - `schools`, `admins`, `teachers`, `students`, `parents`, `users`, etc.
     - Match column names (`auth_user_id`, `school_id`, etc.).
     - Add relations where FK exists in SQL.
2. **Neon DB setup**
   - Apply `backend/database-schema.sql` to Neon (SQL editor or `psql`).
3. **Regenerate Prisma client**
   - `cd backend`
   - `npx prisma generate`
4. **Backend fixes**
   - Update AuthService profile lookups to use `auth_user_id`.
   - Ensure `/auth/me` returns correct role and profile data.

---

## Step 4: Backend Core Endpoints (From Map)

### Goal

Implement the mapped REST endpoints to replace Supabase table access.

### Deliverables

- Core CRUD endpoints for `schools`, `users`, `students`, `teachers`, `parents`, `classes`, `subjects`.
- Tenant scoping on all queries (`school_id`).

### High-level tasks

1. Implement endpoints in priority order from `supabase_to_nestjs_map.md`.
2. Add guards for JWT + roles + tenant scoping.
3. Validate DTOs with `class-validator`.

### Detailed implementation plan (Claude execution guide)

#### 1) Core wiring and guards

1. **Confirm DTOs + validation**
   - Ensure each module has `Create`, `Update`, and `Query` DTOs.
   - Use `class-validator` + `class-transformer`.
   - Reject extra fields (`ValidationPipe` already enabled).

2. **Tenant scoping**
   - Every query must include `school_id` or derive it:
     - Admin/Teacher/Parent: use `schoolId` from JWT.
     - Student: resolve via `class_id -> classes.school_id`.
   - Never accept `school_id` from client for tenant-bound reads.

3. **RBAC enforcement**
   - Use `JwtAuthGuard` + `RolesGuard` + `TenantGuard` as applicable.
   - Validate role requirements at controller level.

#### 2) Endpoint order (implement in this sequence)

**A. Users (foundation)**
1. `GET /users/me` (JWT)  
   - Returns `users` row + role + profile.
2. `GET /users` (Admin)  
   - Filter by `school_id`.
3. `POST /users` (Admin)  
   - Creates user + role-specific table record if applicable.
4. `PUT /users/:id` (Admin or Self)  
   - Ensure tenant + self check.
5. `DELETE /users/:id` (Admin)  
   - Ensure tenant.

**B. Schools**
1. `GET /schools` (Public)  
   - List for login.
2. `GET /schools/:id` (JWT)  
   - Tenant match required.
3. `PUT /schools/:id` (Admin)  
   - Tenant match required.

**C. Students**
1. `GET /students` (Admin/Teacher)  
   - Filter by `school_id` (teacher: only their classes).
2. `GET /students/:id` (Admin/Teacher/Parent/Student)  
   - Parent: only children; Student: self.
3. `POST /students` (Admin)  
   - Create student + users row.
4. `PUT /students/:id` (Admin)  
5. `DELETE /students/:id` (Admin)

**D. Teachers**
1. `GET /teachers` (Admin)  
2. `GET /teachers/:id` (Admin/Teacher-self)  
3. `POST /teachers` (Admin)  
4. `PUT /teachers/:id` (Admin)  
5. `DELETE /teachers/:id` (Admin)

**E. Parents**
1. `GET /parents` (Admin)  
2. `GET /parents/:id` (Admin/Parent-self)  
3. `POST /parents` (Admin)  
4. `PUT /parents/:id` (Admin)  
5. `DELETE /parents/:id` (Admin)

**F. Classes**
1. `GET /classes` (Admin/Teacher)  
2. `GET /classes/:id` (Admin/Teacher)  
3. `POST /classes` (Admin)  
4. `PUT /classes/:id` (Admin)  
5. `DELETE /classes/:id` (Admin)

**G. Subjects**
1. `GET /subjects` (Admin/Teacher)  
2. `GET /subjects/:id` (Admin/Teacher)  
3. `POST /subjects` (Admin)  
4. `PUT /subjects/:id` (Admin)  
5. `DELETE /subjects/:id` (Admin)

#### 3) Notes for implementation

- Use `auth_user_id` as the primary identity for logged-in users.
- Ensure `users` table is kept in sync when creating role tables.
- Prefer `findFirst` for non-unique fields (e.g., `subdomain`).
- Always include `school_id` in create mutations where required.
- Use `include` for role-specific profile hydration only when needed.

#### 4) Minimal test checklist

- Login -> `/auth/me` returns correct role and profile.
- Admin can list/create users, students, teachers, parents.
- Teacher can only see own classes and class students.
- Student/Parent can only access their own data.

---

## Step 5: Feature Modules

### Goal

Implement the remaining feature modules matching the SQL schema.

### Modules

- Attendance, Assignments, Submissions
- Exams, Exam Timetable, Results
- Fees, Payroll
- Messaging, Notifications
- Library, Inventory, Transport, Events
  
---

## Status

- Step 1: Done
- Step 2: Done
- Step 3: Done (Neon schema pushed; backend compile errors fixed)
- Step 4: Next
  
Token usage: total=161,438 input=149,357 (+ 2,706,944 cached) output=12,081 (reasoning 1,472)
To continue this session, run codex resume 019bb317-35dd-77a1-a0f7-86564bdf8a64
63051 49490
