import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BackButton } from '@/components/BackButton';
import { Users, Search, Mail, Phone, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface Student {
  student_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  roll_no: string | null;
  section: string | null;
  status: string | null;
  class_id: string | null;
  classes: {
    class_name: string;
    section: string | null;
  }[] | null;
}

export default function StudentsList() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          student_id,
          full_name,
          email,
          phone,
          roll_no,
          section,
          status,
          class_id,
          classes (
            class_name,
            section
          )
        `)
        .order('full_name', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.roll_no && student.roll_no.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackButton />
      
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">All Students</h2>
        <p className="text-muted-foreground">Complete list of enrolled students</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {filteredStudents.length} Students
        </Badge>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading students...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <Card key={student.student_id} className="hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pastel-blue/30 rounded-lg">
                      <Users className="h-5 w-5 text-pastel-blue" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{student.full_name}</CardTitle>
                      <CardDescription>
                        {student.classes?.[0]?.class_name || 'No class'} {student.classes?.[0]?.section || student.section || ''}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                    {student.status || 'active'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {student.roll_no && (
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Roll No:</span>
                    <span className="font-medium">{student.roll_no}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground truncate">{student.email}</span>
                </div>
                {student.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{student.phone}</span>
                  </div>
                )}
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => navigate(`/admin/students/${student.student_id}`)}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredStudents.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No students found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
