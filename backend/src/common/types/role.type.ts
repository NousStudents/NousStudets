/**
 * Role types based on database-schema.sql
 * Role is determined by which table has the auth_user_id:
 * - super_admins -> 'super_admin'
 * - admins -> 'admin'
 * - teachers -> 'teacher'
 * - students -> 'student'
 * - parents -> 'parent'
 */
export type Role = 'super_admin' | 'admin' | 'teacher' | 'student' | 'parent';

/**
 * All valid roles as an array for validation
 */
export const VALID_ROLES: Role[] = ['super_admin', 'admin', 'teacher', 'student', 'parent'];

/**
 * Role priority for determining primary role when user has multiple
 * Higher number = higher priority
 */
export const ROLE_PRIORITY: Record<Role, number> = {
    super_admin: 5,
    admin: 4,
    teacher: 3,
    parent: 2,
    student: 1,
};
