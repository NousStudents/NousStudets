export const Roles = {
  ADMIN: "admin",
  TEACHER: "teacher",
  STUDENT: "student",
  PARENT: "parent",
} as const;

type Role = typeof Roles[keyof typeof Roles];

const PERMS: Record<Role, string[]> = {
  admin: [
    "manage:tenant",
    "manage:users",
    "manage:classes",
    "manage:subjects",
    "manage:exams",
    "manage:fees",
    "manage:library",
    "manage:inventory",
    "manage:transport",
    "manage:payroll",
    "view:reports",
    "broadcast:notify",
    "create:assignments",
    "grade:submissions",
    "mark:attendance",
  ],
  teacher: [
    "manage:classes",
    "create:assignments",
    "grade:submissions",
    "mark:attendance",
    "notify:class",
    "view:students",
    "manage:library",
  ],
  student: [
    "submit:assignments",
    "view:self",
    "view:results",
    "view:timetable",
    "view:attendance",
    "view:fees",
  ],
  parent: [
    "view:child",
    "view:child:results",
    "view:child:attendance",
    "view:child:fees",
    "message:teacher",
  ],
};

export const can = (role: string | undefined | null, action: string): boolean => {
  if (!role) return false;
  return (PERMS as any)[role]?.includes(action) || false;
};

export const hasAnyRole = (
  role: string | undefined | null, 
  allowedRoles: Role[]
): boolean => {
  if (!role) return false;
  return allowedRoles.includes(role as Role);
};
