import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BackButton } from '@/components/BackButton';
import { Users, Search, Mail, Phone, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface Parent {
  parent_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  relation: string | null;
  occupation: string | null;
  status: string | null;
  students: {
    student_id: string;
    full_name: string;
    classes: {
      class_name: string;
      section: string | null;
    } | null;
  }[];
}

export default function ParentsList() {
  const navigate = useNavigate();
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchParents();
  }, []);

  const fetchParents = async () => {
    try {
      const { data: parentsData, error: parentsError } = await supabase
        .from('parents')
        .select('*')
        .order('full_name', { ascending: true });

      if (parentsError) throw parentsError;

      // Fetch students for each parent
      const parentsWithStudents = await Promise.all(
        (parentsData || []).map(async (parent) => {
          const { data: studentsData } = await supabase
            .from('students')
            .select(`
              student_id,
              full_name,
              classes (
                class_name,
                section
              )
            `)
            .eq('parent_id', parent.parent_id);

          return {
            ...parent,
            students: studentsData || []
          };
        })
      );

      setParents(parentsWithStudents);
    } catch (error) {
      console.error('Error fetching parents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredParents = parents.filter(parent =>
    parent.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parent.students.some(student => student.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackButton />
      
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">All Parents</h2>
        <p className="text-muted-foreground">Complete list of registered guardians</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by parent name, email, or child name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {filteredParents.length} Parents
        </Badge>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading parents...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredParents.map((parent) => (
            <Card key={parent.parent_id} className="hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pastel-yellow/30 rounded-lg">
                      <Users className="h-5 w-5 text-pastel-yellow" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{parent.full_name}</CardTitle>
                      <CardDescription>
                        {parent.relation || 'Guardian'} {parent.occupation && `• ${parent.occupation}`}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={parent.status === 'active' ? 'default' : 'secondary'}>
                    {parent.status || 'active'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground truncate">{parent.email}</span>
                </div>
                {parent.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{parent.phone}</span>
                  </div>
                )}
                
                {parent.students.length > 0 && (
                  <div className="border-t pt-3 mt-3">
                    <p className="text-xs text-muted-foreground mb-2">Children:</p>
                    <div className="space-y-2">
                      {parent.students.map((student) => (
                        <div key={student.student_id} className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{student.full_name}</span>
                          {student.classes && (
                            <Badge variant="outline" className="text-xs">
                              {student.classes.class_name} {student.classes.section || ''}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => navigate(`/admin/parents/${parent.parent_id}`)}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredParents.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No parents found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
