import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BackButton } from '@/components/BackButton';
import { UserPlus, Search, Mail, Phone, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface Teacher {
  teacher_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  subject_specialization: string | null;
  qualification: string | null;
  experience: number | null;
  status: string | null;
}

export default function TeachersList() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (teacher.subject_specialization && teacher.subject_specialization.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackButton />
      
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">All Teachers</h2>
        <p className="text-muted-foreground">Complete list of faculty members</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {filteredTeachers.length} Teachers
        </Badge>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading teachers...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeachers.map((teacher) => (
            <Card key={teacher.teacher_id} className="hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pastel-peach/30 rounded-lg">
                      <UserPlus className="h-5 w-5 text-pastel-coral" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{teacher.full_name}</CardTitle>
                      <CardDescription>
                        {teacher.subject_specialization || 'General'}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={teacher.status === 'active' ? 'default' : 'secondary'}>
                    {teacher.status || 'active'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {teacher.qualification && (
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Qualification:</span>
                    <span className="font-medium">{teacher.qualification}</span>
                  </div>
                )}
                {teacher.experience && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Experience:</span>
                    <span className="font-medium">{teacher.experience} years</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground truncate">{teacher.email}</span>
                </div>
                {teacher.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{teacher.phone}</span>
                  </div>
                )}
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => navigate(`/admin/teachers/${teacher.teacher_id}`)}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredTeachers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <UserPlus className="h-16 w-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No teachers found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
