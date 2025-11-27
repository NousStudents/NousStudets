import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BackButton } from '@/components/BackButton';
import { UserCheck, Search, Shield, Users, UserPlus, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface UserData {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
  status: string | null;
}

export default function UsersList() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const [adminsRes, teachersRes, studentsRes, parentsRes] = await Promise.all([
        supabase.from('admins').select('admin_id as id, full_name, email, status'),
        supabase.from('teachers').select('teacher_id as id, full_name, email, status'),
        supabase.from('students').select('student_id as id, full_name, email, status'),
        supabase.from('parents').select('parent_id as id, full_name, email, status')
      ]);

      const allUsers: UserData[] = [
        ...((adminsRes.data || []) as any[]).map(u => ({ ...u, role: 'admin' as const })),
        ...((teachersRes.data || []) as any[]).map(u => ({ ...u, role: 'teacher' as const })),
        ...((studentsRes.data || []) as any[]).map(u => ({ ...u, role: 'student' as const })),
        ...((parentsRes.data || []) as any[]).map(u => ({ ...u, role: 'parent' as const }))
      ];

      // Sort: admins first, then alphabetically
      allUsers.sort((a, b) => {
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (a.role !== 'admin' && b.role === 'admin') return 1;
        return a.full_name.localeCompare(b.full_name);
      });

      setUsers(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'teacher': return <UserPlus className="h-4 w-4" />;
      case 'student': return <User className="h-4 w-4" />;
      case 'parent': return <Users className="h-4 w-4" />;
      default: return <UserCheck className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-destructive/10 border-destructive/50 text-destructive';
      case 'teacher': return 'bg-pastel-peach/30 border-pastel-peach/50';
      case 'student': return 'bg-pastel-blue/30 border-pastel-blue/50';
      case 'parent': return 'bg-pastel-yellow/30 border-pastel-yellow/50';
      default: return 'bg-muted/50';
    }
  };

  const adminCount = users.filter(u => u.role === 'admin').length;
  const teacherCount = users.filter(u => u.role === 'teacher').length;
  const studentCount = users.filter(u => u.role === 'student').length;
  const parentCount = users.filter(u => u.role === 'parent').length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackButton />
      
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Active Users</h2>
        <p className="text-muted-foreground">All system users with their roles</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-destructive/10 border-destructive/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-pastel-peach/30 border-pastel-peach/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Teachers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teacherCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-pastel-blue/30 border-pastel-blue/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-pastel-yellow/30 border-pastel-yellow/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Parents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parentCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading users...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredUsers.map((user) => (
            <Card 
              key={user.id} 
              className={`${getRoleColor(user.role)} ${user.role === 'admin' ? 'border-2' : ''} hover:shadow-lg transition-all`}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-background/50 rounded-lg">
                      {getRoleIcon(user.role)}
                    </div>
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        {user.full_name}
                        {user.role === 'admin' && (
                          <Badge variant="destructive" className="text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            ADMIN
                          </Badge>
                        )}
                      </h4>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {user.role}
                    </Badge>
                    <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                      {user.status || 'active'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredUsers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <UserCheck className="h-16 w-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">No users found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
