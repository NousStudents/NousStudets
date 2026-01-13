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
