import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { FileText, Save } from 'lucide-react';

interface Exam {
  exam_id: string;
  exam_name: string;
}

interface Subject {
  subject_id: string;
  subject_name: string;
}

interface StudentMark {
  student_id: string;
  full_name: string;
  roll_no: string | null;
  result_id?: string;
  marks_obtained: number | null;
  max_marks: number | null;
}

interface MarksEntrySectionProps {
  classId: string;
}

export function MarksEntrySection({ classId }: MarksEntrySectionProps) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<StudentMark[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [maxMarks, setMaxMarks] = useState('100');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchExamsAndSubjects();
  }, [classId]);

  useEffect(() => {
    if (selectedExam && selectedSubject) {
      fetchStudentsWithMarks();
    }
  }, [selectedExam, selectedSubject]);

  const fetchExamsAndSubjects = async () => {
    try {
      const [examsRes, subjectsRes] = await Promise.all([
        supabase.from('exams').select('exam_id, exam_name').eq('class_id', classId),
        supabase.from('subjects').select('subject_id, subject_name').eq('class_id', classId)
      ]);

      if (examsRes.error) throw examsRes.error;
      if (subjectsRes.error) throw subjectsRes.error;

      setExams(examsRes.data || []);
      setSubjects(subjectsRes.data || []);
    } catch (error: any) {
      toast.error('Failed to load exams and subjects');
      console.error('Error:', error);
    }
  };

  const fetchStudentsWithMarks = async () => {
    setLoading(true);
    try {
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('student_id, full_name, roll_no')
        .eq('class_id', classId)
        .order('roll_no', { ascending: true });

      if (studentsError) throw studentsError;

      const { data: resultsData } = await supabase
        .from('exam_results')
        .select('result_id, student_id, marks_obtained, max_marks')
        .eq('exam_id', selectedExam)
        .eq('subject_id', selectedSubject);

      const resultsMap = new Map(
        resultsData?.map(r => [
          r.student_id,
          { result_id: r.result_id, marks_obtained: r.marks_obtained, max_marks: r.max_marks }
        ]) || []
      );

      const studentsWithMarks = studentsData?.map(student => ({
        ...student,
        result_id: resultsMap.get(student.student_id)?.result_id,
        marks_obtained: resultsMap.get(student.student_id)?.marks_obtained || null,
        max_marks: resultsMap.get(student.student_id)?.max_marks || null
      })) || [];

      setStudents(studentsWithMarks);
    } catch (error: any) {
      toast.error('Failed to load students');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMarks = (studentId: string, marks: string) => {
    const marksNum = marks === '' ? null : parseFloat(marks);
    setStudents(prev =>
      prev.map(s =>
        s.student_id === studentId
          ? { ...s, marks_obtained: marksNum, max_marks: parseFloat(maxMarks) }
          : s
      )
    );
  };

  const saveMarks = async () => {
    if (!selectedExam || !selectedSubject) {
      toast.error('Please select exam and subject');
      return;
    }

    setSaving(true);
    try {
      const records = students
        .filter(s => s.marks_obtained !== null)
        .map(s => ({
          exam_id: selectedExam,
          subject_id: selectedSubject,
          student_id: s.student_id,
          marks_obtained: s.marks_obtained,
          max_marks: parseFloat(maxMarks)
        }));

      // Delete existing results
      await supabase
        .from('exam_results')
        .delete()
        .eq('exam_id', selectedExam)
        .eq('subject_id', selectedSubject);

      // Insert new results
      const { error } = await supabase.from('exam_results').insert(records);

      if (error) throw error;

      toast.success('Marks saved successfully');
      fetchStudentsWithMarks();
    } catch (error: any) {
      toast.error('Failed to save marks');
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Marks Entry</CardTitle>
        <CardDescription>Enter and manage student examination marks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selection Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Select Exam</Label>
            <Select value={selectedExam} onValueChange={setSelectedExam}>
              <SelectTrigger>
                <SelectValue placeholder="Choose exam" />
              </SelectTrigger>
              <SelectContent>
                {exams.map(exam => (
                  <SelectItem key={exam.exam_id} value={exam.exam_id}>
                    {exam.exam_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Select Subject</Label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Choose subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map(subject => (
                  <SelectItem key={subject.subject_id} value={subject.subject_id}>
                    {subject.subject_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Maximum Marks</Label>
            <Input
              type="number"
              value={maxMarks}
              onChange={(e) => setMaxMarks(e.target.value)}
              placeholder="100"
            />
          </div>
        </div>

        {/* Marks Entry Table */}
        {selectedExam && selectedSubject ? (
          loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No students found</p>
            </div>
          ) : (
            <>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {students.map(student => (
                  <div
                    key={student.student_id}
                    className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg"
                  >
                    <span className="font-mono text-sm text-muted-foreground min-w-[60px]">
                      {student.roll_no || '-'}
                    </span>
                    <span className="font-medium flex-1">{student.full_name}</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={student.marks_obtained ?? ''}
                        onChange={(e) => updateMarks(student.student_id, e.target.value)}
                        placeholder="0"
                        className="w-24"
                        min="0"
                        max={maxMarks}
                        step="0.01"
                      />
                      <span className="text-sm text-muted-foreground">/ {maxMarks}</span>
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={saveMarks} disabled={saving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save All Marks'}
              </Button>
            </>
          )
        ) : (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">Select exam and subject to enter marks</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
