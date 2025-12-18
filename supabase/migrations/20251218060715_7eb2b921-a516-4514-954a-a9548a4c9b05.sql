-- Allow teachers to view classes where they are assigned as class teacher
CREATE POLICY "Teachers can view classes they are assigned to"
ON public.classes
FOR SELECT
USING (
  has_role('teacher') AND (
    class_teacher_id = get_teacher_id()
    OR class_id IN (
      SELECT DISTINCT class_id FROM timetable WHERE teacher_id = get_teacher_id()
    )
    OR class_id IN (
      SELECT DISTINCT class_id FROM subjects WHERE teacher_id = get_teacher_id()
    )
  )
);