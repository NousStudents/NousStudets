-- Add missing foreign key relationship between students and classes
ALTER TABLE public.students 
ADD CONSTRAINT students_class_id_fkey 
FOREIGN KEY (class_id) 
REFERENCES public.classes(class_id) 
ON DELETE SET NULL;