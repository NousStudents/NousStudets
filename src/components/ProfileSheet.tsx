import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LogOut, User, Mail, School, Users, BookOpen } from 'lucide-react';

interface ProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserProfile {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  phone?: string;
}

interface StudentInfo {
  student_id: string;
  roll_no?: string;
  class?: {
    class_name: string;
    section?: string;
  };
}

interface TeacherInfo {
  teacher_id: string;
  qualification?: string;
  subjects?: Array<{
    subject_name: string;
  }>;
}

interface ParentInfo {
  parent_id: string;
  relation?: string;
  students?: Array<{
    full_name: string;
    roll_no?: string;
  }>;
}

export const ProfileSheet = ({ open, onOpenChange }: ProfileSheetProps) => {
  const { user, signOut } = useAuth();
  const { role } = useRole();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roleDetails, setRoleDetails] = useState<StudentInfo | TeacherInfo | ParentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && user) {
      fetchProfileData();
    }
  }, [open, user]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);

      if (!user || !role) return;

      // Fetch from role-specific table
      if (role === 'student') {
        const { data: studentData } = await supabase
          .from('students')
          .select(`
            student_id,
            full_name,
            email,
            phone,
            roll_no,
            class_id,
            classes (class_name, section)
          `)
          .eq('auth_user_id', user.id)
          .single();

        if (studentData) {
          setProfile({
            user_id: studentData.student_id,
            full_name: studentData.full_name,
            email: studentData.email,
            role: 'student',
            phone: studentData.phone,
          });
          setRoleDetails({
            student_id: studentData.student_id,
            roll_no: studentData.roll_no,
            class: studentData.classes as any,
          });
        }
      } else if (role === 'teacher') {
        const { data: teacherData } = await supabase
          .from('teachers')
          .select(`
            teacher_id,
            full_name,
            email,
            phone,
            qualification,
            subjects (subject_name)
          `)
          .eq('auth_user_id', user.id)
          .single();

        if (teacherData) {
          setProfile({
            user_id: teacherData.teacher_id,
            full_name: teacherData.full_name,
            email: teacherData.email,
            role: 'teacher',
            phone: teacherData.phone,
          });
          setRoleDetails({
            teacher_id: teacherData.teacher_id,
            qualification: teacherData.qualification,
            subjects: teacherData.subjects as any,
          });
        }
      } else if (role === 'parent') {
        const { data: parentData } = await supabase
          .from('parents')
          .select('parent_id, full_name, email, phone, relation')
          .eq('auth_user_id', user.id)
          .single();

        if (parentData) {
          setProfile({
            user_id: parentData.parent_id,
            full_name: parentData.full_name,
            email: parentData.email,
            role: 'parent',
            phone: parentData.phone,
          });

          // Fetch linked students separately
          const { data: studentsData } = await supabase
            .from('students')
            .select('full_name, roll_no')
            .eq('parent_id', parentData.parent_id);

          setRoleDetails({
            parent_id: parentData.parent_id,
            relation: parentData.relation,
            students: studentsData?.map((s: any) => ({
              full_name: s.full_name,
              roll_no: s.roll_no,
            })) || [],
          });
        }
      } else if (role === 'admin') {
        const { data: adminData } = await supabase
          .from('admins')
          .select('admin_id, full_name, email, phone')
          .eq('auth_user_id', user.id)
          .single();

        if (adminData) {
          setProfile({
            user_id: adminData.admin_id,
            full_name: adminData.full_name,
            email: adminData.email,
            role: 'admin',
            phone: adminData.phone,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </SheetTitle>
          <SheetDescription>
            Your account information and details
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="space-y-6 mt-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-full">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium text-foreground">{profile?.full_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-secondary/10 rounded-full">
                  <Mail className="h-6 w-6 text-secondary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{profile?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-accent/10 rounded-full">
                  <School className="h-6 w-6 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Role</p>
                  <Badge variant="secondary" className="capitalize">
                    {profile?.role}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Role-specific details */}
            {role === 'student' && roleDetails && 'class' in roleDetails && (
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Student Details
                </h3>
                {roleDetails.roll_no && (
                  <div>
                    <p className="text-sm text-muted-foreground">Roll Number</p>
                    <p className="font-medium">{roleDetails.roll_no}</p>
                  </div>
                )}
                {roleDetails.class && (
                  <div>
                    <p className="text-sm text-muted-foreground">Class</p>
                    <p className="font-medium">
                      {roleDetails.class.class_name}
                      {roleDetails.class.section && ` - ${roleDetails.class.section}`}
                    </p>
                  </div>
                )}
              </div>
            )}

            {role === 'teacher' && roleDetails && 'qualification' in roleDetails && (
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Teacher Details
                </h3>
                {roleDetails.qualification && (
                  <div>
                    <p className="text-sm text-muted-foreground">Qualification</p>
                    <p className="font-medium">{roleDetails.qualification}</p>
                  </div>
                )}
                {roleDetails.subjects && roleDetails.subjects.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Subjects</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {roleDetails.subjects.map((subject, idx) => (
                        <Badge key={idx} variant="outline">
                          {subject.subject_name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {role === 'parent' && roleDetails && 'students' in roleDetails && (
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Parent Details
                </h3>
                {roleDetails.relation && (
                  <div>
                    <p className="text-sm text-muted-foreground">Relation</p>
                    <p className="font-medium capitalize">{roleDetails.relation}</p>
                  </div>
                )}
                {roleDetails.students && roleDetails.students.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Children</p>
                    <div className="space-y-2 mt-1">
                      {roleDetails.students.map((student, idx) => (
                        <div key={idx} className="p-2 bg-muted rounded-lg">
                          <p className="font-medium">{student.full_name}</p>
                          {student.roll_no && (
                            <p className="text-sm text-muted-foreground">Roll: {student.roll_no}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* Logout Button */}
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
