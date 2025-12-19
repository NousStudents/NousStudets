-- Add policies for teachers and admins to manage exam results

-- Teachers can insert exam results for subjects they teach
CREATE POLICY "Teachers can insert exam results"
ON public.exam_results
FOR INSERT
WITH CHECK (
  has_role('teacher') AND subject_id IN (
    SELECT subject_id FROM subjects WHERE teacher_id = get_teacher_id()
  )
);

-- Teachers can update exam results for subjects they teach
CREATE POLICY "Teachers can update exam results"
ON public.exam_results
FOR UPDATE
USING (
  has_role('teacher') AND subject_id IN (
    SELECT subject_id FROM subjects WHERE teacher_id = get_teacher_id()
  )
);

-- Teachers can delete exam results for subjects they teach
CREATE POLICY "Teachers can delete exam results"
ON public.exam_results
FOR DELETE
USING (
  has_role('teacher') AND subject_id IN (
    SELECT subject_id FROM subjects WHERE teacher_id = get_teacher_id()
  )
);

-- Admins can manage all exam results in their school
CREATE POLICY "Admins can manage exam results"
ON public.exam_results
FOR ALL
USING (
  has_role('admin') AND exam_id IN (
    SELECT exam_id FROM exams WHERE school_id = current_school_id()
  )
)
WITH CHECK (
  has_role('admin') AND exam_id IN (
    SELECT exam_id FROM exams WHERE school_id = current_school_id()
  )
);