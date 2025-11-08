# RBAC + Multi-Tenancy (School = Tenant)

## Overview

This school management system implements **Role-Based Access Control (RBAC)** and **Multi-Tenancy** where each school is a separate tenant with isolated data.

## Architecture

### Multi-Tenancy
- **Tenancy Model**: Each school = one tenant
- **Isolation**: Data is isolated by `school_id` in all tables
- **Resolution**: Can be resolved from subdomain (`alpha.app.com` → `alpha`) or manually via `TenantContext`
- **RLS Enforcement**: Row-Level Security policies ensure users only access their school's data

### Role-Based Access Control

Roles are stored in a **separate `user_roles` table** (not in the users table) to prevent privilege escalation attacks.

#### Available Roles

1. **Admin**
   - Full system access within their school
   - Can manage users, classes, subjects, exams, fees, library, inventory, transport, payroll
   - Can broadcast notifications
   - Can view all reports

2. **Teacher**
   - Can manage classes they're assigned to
   - Can create assignments
   - Can mark attendance
   - Can grade submissions
   - Can send notifications to their classes
   - Can manage library

3. **Student**
   - Can submit assignments
   - Can view their own results
   - Can view timetable and attendance
   - Can view their fees

4. **Parent**
   - Can view their child's information
   - Can view their child's results, attendance, fees
   - Can message teachers

## Security Features

### Secure Role Management
```sql
-- Roles stored in separate table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES public.users(user_id),
  role app_role NOT NULL,
  granted_by UUID,
  granted_at TIMESTAMP
);

-- Security definer function prevents RLS recursion
CREATE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public;
```

### Multi-Tenant Isolation
All queries are scoped by `school_id`:
```typescript
// Using tenant-aware helpers
import { selectByTenant, insertWithTenant } from '@/utils/tenantSupabase';

// Select students from current school
const students = await selectByTenant('students', schoolId);

// Insert with tenant scope
await insertWithTenant('classes', { class_name: 'Grade 10A' }, schoolId);
```

## Usage

### Protecting Routes
```tsx
import ProtectedRoute from '@/components/ProtectedRoute';

<ProtectedRoute roles={['admin']}>
  <AdminDashboard />
</ProtectedRoute>

<ProtectedRoute roles={['admin', 'teacher']}>
  <ClassManagement />
</ProtectedRoute>
```

### Checking Permissions
```tsx
import { useRole } from '@/hooks/useRole';
import { can } from '@/utils/rbac';

function MyComponent() {
  const { role, isAdmin, isTeacher } = useRole();

  if (can(role, 'manage:users')) {
    // Show user management UI
  }

  if (isAdmin || isTeacher) {
    // Show staff features
  }
}
```

### Tenant Context
```tsx
import { useTenant } from '@/contexts/TenantContext';

function MyComponent() {
  const { schoolId, resolvedFrom } = useTenant();
  
  // schoolId: current tenant ID
  // resolvedFrom: "subdomain" | "user" | "manual"
}
```

## Database Schema

### Key Helper Functions
- `public.has_role(_user_id, _role)` - Check if user has specific role
- `public.current_user_id()` - Get current authenticated user's user_id
- `public.current_school_id()` - Get current authenticated user's school_id

### RLS Policy Pattern
All tables follow this pattern:
```sql
-- SELECT: Users can view data from their school
CREATE POLICY "name" ON table_name FOR SELECT
USING (school_id = public.current_school_id());

-- INSERT: Role-based with tenant check
CREATE POLICY "name" ON table_name FOR INSERT
WITH CHECK (
  public.has_role(public.current_user_id(), 'admin')
  AND school_id = public.current_school_id()
);
```

## Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_TENANCY_MODE=subdomain  # or "manual"
```

## Best Practices

1. **Always scope by tenant**: Never query data without filtering by `school_id`
2. **Use security definer functions**: Prevents RLS recursion issues
3. **Check roles in RLS policies**: Don't rely on client-side checks alone
4. **Separate role storage**: Never store roles in users/profiles table
5. **Audit role changes**: Track who granted roles and when
6. **Test across roles**: Verify each role can only access permitted data
7. **Monitor cross-tenant access**: Log and alert on any violations

## Migration Notes

The system migrates existing roles from the `users` table to the `user_roles` table automatically. After migration:
- The `role` column in `users` table becomes deprecated (but kept for backward compatibility)
- All role checks use the `has_role()` function
- Admins can manage roles through the `user_roles` table

## Testing Role Access

To test role-based access:
1. Create test users with different roles
2. Log in as each role
3. Verify they can only access permitted features
4. Try to access unauthorized features (should be blocked)
5. Check database directly to ensure RLS policies work

## Troubleshooting

**"User has no role"**: Ensure a record exists in `user_roles` table for the user
**"Access denied"**: Check if user has correct role in `user_roles` table
**"Tenant mismatch"**: Verify user's `school_id` matches current tenant context
**"RLS policy error"**: Check that helper functions exist and are SECURITY DEFINER
