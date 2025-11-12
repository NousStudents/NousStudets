-- STEP 5: Drop all RLS policies that depend on current_user_id()

-- Drop user_roles policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles in their school" ON public.user_roles;

-- Drop users policies
DROP POLICY IF EXISTS "Admins can insert users in their school" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users in their school" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- Drop assignments policies
DROP POLICY IF EXISTS "Teachers can create assignments" ON public.assignments;
DROP POLICY IF EXISTS "Teachers can update their assignments" ON public.assignments;

-- Drop attendance policies
DROP POLICY IF EXISTS "Teachers can mark attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers can update attendance" ON public.attendance;

-- Drop submissions policies
DROP POLICY IF EXISTS "Students can create submissions" ON public.submissions;
DROP POLICY IF EXISTS "Students can view their submissions" ON public.submissions;
DROP POLICY IF EXISTS "Teachers can grade submissions" ON public.submissions;

-- Drop exam_results policies
DROP POLICY IF EXISTS "Restricted exam results access" ON public.exam_results;

-- Drop fees policies
DROP POLICY IF EXISTS "Restricted fees access" ON public.fees;
DROP POLICY IF EXISTS "Admins can manage fees" ON public.fees;

-- Drop schools policies
DROP POLICY IF EXISTS "Admins can update their school" ON public.schools;

-- Drop messages policies
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their sent messages" ON public.messages;

-- Drop notifications policies
DROP POLICY IF EXISTS "Staff can create notifications" ON public.notifications;

-- Drop events policies
DROP POLICY IF EXISTS "Admins can manage events" ON public.events;

-- Drop classes policies
DROP POLICY IF EXISTS "Admins can manage classes" ON public.classes;

-- Drop subjects policies
DROP POLICY IF EXISTS "Admins can manage subjects" ON public.subjects;

-- Drop timetable policies
DROP POLICY IF EXISTS "Staff can manage timetable" ON public.timetable;

-- Drop exams policies
DROP POLICY IF EXISTS "Admins can manage exams" ON public.exams;

-- Drop exam_timetable policies
DROP POLICY IF EXISTS "Admins can manage exam timetable" ON public.exam_timetable;

-- Drop library_books policies
DROP POLICY IF EXISTS "Admins can manage library books" ON public.library_books;

-- Drop library_issues policies
DROP POLICY IF EXISTS "Staff can manage library issues" ON public.library_issues;

-- Drop inventory policies
DROP POLICY IF EXISTS "Admins can manage inventory" ON public.inventory;

-- Drop transport policies
DROP POLICY IF EXISTS "Admins can manage transport" ON public.transport;

-- Drop payroll policies
DROP POLICY IF EXISTS "Payroll restricted access" ON public.payroll;
DROP POLICY IF EXISTS "Admins can manage payroll" ON public.payroll;

-- Drop ai_tools policies
DROP POLICY IF EXISTS "Users can create AI tools" ON public.ai_tools;
DROP POLICY IF EXISTS "Users can update their AI tools" ON public.ai_tools;

-- Drop parents policies
DROP POLICY IF EXISTS "Admins can manage parents" ON public.parents;

-- Drop audit_logs policies
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;

-- Drop teachers policies
DROP POLICY IF EXISTS "Admins can manage teachers" ON public.teachers;

-- Drop students policies
DROP POLICY IF EXISTS "Admins can manage students" ON public.students;

-- Drop admins policies
DROP POLICY IF EXISTS "Admins can manage admins" ON public.admins;