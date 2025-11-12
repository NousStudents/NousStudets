-- STEP 9: Create missing management policies

-- Admins policies
CREATE POLICY "Admins can update their school"
ON public.schools
FOR UPDATE
USING (has_role('admin') AND school_id = current_school_id());

-- Classes policies  
CREATE POLICY "Admins can manage classes"
ON public.classes
FOR ALL
USING (has_role('admin') AND school_id = current_school_id());

-- Subjects policies
CREATE POLICY "Admins can manage subjects"
ON public.subjects
FOR ALL
USING (
  has_role('admin') AND
  class_id IN (
    SELECT class_id FROM public.classes
    WHERE school_id = current_school_id()
  )
);

-- Timetable policies
CREATE POLICY "Staff can manage timetable"
ON public.timetable
FOR ALL
USING (
  (has_role('admin') OR has_role('teacher')) AND
  class_id IN (
    SELECT class_id FROM public.classes
    WHERE school_id = current_school_id()
  )
);

-- Assignments policies
CREATE POLICY "Teachers can create assignments"
ON public.assignments
FOR INSERT
WITH CHECK (
  (has_role('teacher') OR has_role('admin')) AND
  teacher_id = get_teacher_id() AND
  class_id IN (
    SELECT class_id FROM public.classes
    WHERE school_id = current_school_id()
  )
);

CREATE POLICY "Teachers can update their assignments"
ON public.assignments
FOR UPDATE
USING (teacher_id = get_teacher_id());

-- Attendance policies
CREATE POLICY "Teachers can mark attendance"
ON public.attendance
FOR INSERT
WITH CHECK (
  (has_role('teacher') OR has_role('admin')) AND
  class_id IN (
    SELECT class_id FROM public.classes
    WHERE school_id = current_school_id()
  )
);

CREATE POLICY "Teachers can update attendance"
ON public.attendance
FOR UPDATE
USING (marked_by = get_teacher_id());

-- Submissions policies
CREATE POLICY "Students can create submissions"
ON public.submissions
FOR INSERT
WITH CHECK (
  has_role('student') AND
  student_id = get_student_id()
);

CREATE POLICY "Students can view their submissions"
ON public.submissions
FOR SELECT
USING (
  student_id = get_student_id() OR
  has_role('teacher') OR
  has_role('admin')
);

CREATE POLICY "Teachers can grade submissions"
ON public.submissions
FOR UPDATE
USING (has_role('teacher') OR has_role('admin'));

-- Exam results policies
CREATE POLICY "Restricted exam results access"
ON public.exam_results
FOR SELECT
USING (
  has_role('admin') OR
  (has_role('student') AND student_id = get_student_id()) OR
  (has_role('parent') AND student_id IN (
    SELECT student_id FROM public.students
    WHERE parent_id = get_parent_id()
  )) OR
  (has_role('teacher') AND subject_id IN (
    SELECT subject_id FROM public.subjects
    WHERE teacher_id = get_teacher_id()
  ))
);

-- Fees policies
CREATE POLICY "Restricted fees access"
ON public.fees
FOR SELECT
USING (
  has_role('admin') OR
  (has_role('student') AND student_id = get_student_id()) OR
  (has_role('parent') AND student_id IN (
    SELECT student_id FROM public.students
    WHERE parent_id = get_parent_id()
  ))
);

CREATE POLICY "Admins can manage fees"
ON public.fees
FOR ALL
USING (has_role('admin') AND school_id = current_school_id());

-- Messages policies
CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
WITH CHECK (
  sender_id IN (
    SELECT COALESCE(get_teacher_id(), get_student_id(), get_parent_id(), get_admin_id())
  ) AND
  school_id = current_school_id()
);

CREATE POLICY "Users can update their sent messages"
ON public.messages
FOR UPDATE
USING (
  sender_id IN (
    SELECT COALESCE(get_teacher_id(), get_student_id(), get_parent_id(), get_admin_id())
  )
);

-- Notifications policies
CREATE POLICY "Staff can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (
  (has_role('admin') OR has_role('teacher')) AND
  school_id = current_school_id()
);

-- Events policies
CREATE POLICY "Admins can manage events"
ON public.events
FOR ALL
USING (has_role('admin') AND school_id = current_school_id());

-- Exams policies
CREATE POLICY "Admins can manage exams"
ON public.exams
FOR ALL
USING (has_role('admin') AND school_id = current_school_id());

-- Exam timetable policies
CREATE POLICY "Admins can manage exam timetable"
ON public.exam_timetable
FOR ALL
USING (has_role('admin'));

-- Library books policies
CREATE POLICY "Admins can manage library books"
ON public.library_books
FOR ALL
USING (has_role('admin') AND school_id = current_school_id());

-- Library issues policies
CREATE POLICY "Staff can manage library issues"
ON public.library_issues
FOR ALL
USING (has_role('admin') OR has_role('teacher'));

-- Inventory policies
CREATE POLICY "Admins can manage inventory"
ON public.inventory
FOR ALL
USING (has_role('admin') AND school_id = current_school_id());

-- Transport policies
CREATE POLICY "Admins can manage transport"
ON public.transport
FOR ALL
USING (has_role('admin') AND school_id = current_school_id());

-- Payroll policies
CREATE POLICY "Payroll restricted access"
ON public.payroll
FOR SELECT
USING (
  has_role('admin') OR
  teacher_id = get_teacher_id()
);

CREATE POLICY "Admins can manage payroll"
ON public.payroll
FOR ALL
USING (has_role('admin'));

-- AI tools policies
CREATE POLICY "Users can create AI tools"
ON public.ai_tools
FOR INSERT
WITH CHECK (
  user_id IN (
    SELECT COALESCE(get_teacher_id(), get_student_id(), get_parent_id(), get_admin_id())
  )
);

CREATE POLICY "Users can update their AI tools"
ON public.ai_tools
FOR UPDATE
USING (
  user_id IN (
    SELECT COALESCE(get_teacher_id(), get_student_id(), get_parent_id(), get_admin_id())
  )
);

-- Parents policies
CREATE POLICY "Admins can manage parents"
ON public.parents
FOR ALL
USING (has_role('admin') AND school_id = current_school_id());

-- Audit logs policies
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role('admin'));

-- Teachers policies
CREATE POLICY "Admins can manage teachers"
ON public.teachers
FOR ALL
USING (has_role('admin') AND school_id = current_school_id());

-- Students policies
CREATE POLICY "Admins can manage students"
ON public.students
FOR ALL
USING (
  has_role('admin') AND
  EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.class_id = students.class_id
    AND c.school_id = current_school_id()
  )
);

-- Admins policies
CREATE POLICY "Admins can manage admins"
ON public.admins
FOR ALL
USING (has_role('admin') AND school_id = current_school_id());