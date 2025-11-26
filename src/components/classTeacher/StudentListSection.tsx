import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Search, Mail, Phone, User } from 'lucide-react';

interface Student {
  student_id: string;
  full_name: string;
  email: string;
  roll_no: string | null;
  phone: string | null;
  dob: string | null;
  gender: string | null;
  profile_picture: string | null;
  parent_id: string | null;
  parents?: {
    full_name: string;
    phone: string | null;
    email: string;
  } | null;
}

interface StudentListSectionProps {
  classId: string;
}

export function StudentListSection({ classId }: StudentListSectionProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, [classId]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredStudents(
        students.filter(
          s =>
            s.full_name.toLowerCase().includes(query) ||
            s.email.toLowerCase().includes(query) ||
            s.roll_no?.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredStudents(students);
    }
  }, [searchQuery, students]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', classId)
        .order('roll_no', { ascending: true });

      if (error) throw error;

      // Fetch parent info for students who have parents
      const studentIds = data?.filter(s => s.parent_id).map(s => s.parent_id) || [];
      let parentsData: any[] = [];
      
      if (studentIds.length > 0) {
        const { data: parents } = await supabase
          .from('parents')
          .select('parent_id, full_name, phone, email')
          .in('parent_id', studentIds);
        parentsData = parents || [];
      }

      const parentsMap = new Map(parentsData.map(p => [p.parent_id, p]));
      
      const studentsWithParents = data?.map(student => ({
        ...student,
        parents: student.parent_id ? parentsMap.get(student.parent_id) : null
      })) || [];

      setStudents(studentsWithParents as any);
      setFilteredStudents(studentsWithParents as any);
    } catch (error: any) {
      toast.error('Failed to load students');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Card><CardContent className="py-12 text-center">Loading...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student List</CardTitle>
        <CardDescription>View and manage student information ({students.length} students)</CardDescription>
        <div className="relative pt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or roll number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">
              {searchQuery ? 'No students found matching your search' : 'No students in this class'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredStudents.map(student => (
              <div
                key={student.student_id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={student.profile_picture || ''} alt={student.full_name} />
                    <AvatarFallback>{student.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-lg">{student.full_name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">Roll No: {student.roll_no || '-'}</Badge>
                          {student.gender && <Badge variant="secondary">{student.gender}</Badge>}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span>{student.email}</span>
                      </div>
                      {student.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{student.phone}</span>
                        </div>
                      )}
                    </div>

                    {student.parents && (
                      <div className="p-3 bg-muted/50 rounded-md">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Parent/Guardian</p>
                        <p className="text-sm font-medium">{student.parents.full_name}</p>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                          {student.parents.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {student.parents.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {student.parents.email}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
