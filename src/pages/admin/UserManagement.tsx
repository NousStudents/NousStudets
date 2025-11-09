import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Shield } from "lucide-react";

interface Class {
  class_id: string;
  class_name: string;
  section?: string;
}

interface Student {
  student_id: string;
  roll_no?: string;
  users: {
    full_name: string;
  };
}

export default function UserManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [adminSchoolId, setAdminSchoolId] = useState("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    role: "",
    password: "",
    classId: "",
    selectedStudents: [] as string[],
    qualification: "",
    subjects: "",
  });

  useEffect(() => {
    if (user) {
      fetchAdminData();
    }
  }, [user]);

  useEffect(() => {
    if (adminSchoolId) {
      fetchClasses();
      fetchStudents();
    }
  }, [adminSchoolId]);

  const fetchAdminData = async () => {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('school_id')
        .eq('auth_user_id', user?.id)
        .single();
      
      if (userData) {
        setAdminSchoolId(userData.school_id);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const { data } = await supabase
        .from('classes')
        .select('class_id, class_name, section')
        .eq('school_id', adminSchoolId)
        .order('class_name');
      
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data } = await supabase
        .from('students')
        .select(`
          student_id,
          roll_no,
          users!inner (
            full_name,
            school_id
          )
        `)
        .eq('users.school_id', adminSchoolId)
        .order('roll_no');
      
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleStudentToggle = (studentId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedStudents: prev.selectedStudents.includes(studentId)
        ? prev.selectedStudents.filter(id => id !== studentId)
        : [...prev.selectedStudents, studentId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email || !formData.role || !formData.password) {
      toast({
        title: "Validation Error",
        description: "Name, email, role and password are required",
        variant: "destructive",
      });
      return;
    }

    // Role-specific validations
    if (formData.role === 'student' && !formData.classId) {
      toast({
        title: "Validation Error",
        description: "Please select a class for the student",
        variant: "destructive",
      });
      return;
    }

    if (formData.role === 'parent' && formData.selectedStudents.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please link at least one student to the parent",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          fullName: formData.fullName,
          email: formData.email,
          role: formData.role,
          password: formData.password,
          schoolId: adminSchoolId,
          classId: formData.classId || null,
          linkedStudents: formData.selectedStudents,
          qualification: formData.qualification || null,
          subjects: formData.subjects ? formData.subjects.split(',').map(s => s.trim()) : [],
          sendPasswordResetEmail: false,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `User ${formData.email} created successfully`,
      });

      // Reset form
      setFormData({
        fullName: "",
        email: "",
        role: "",
        password: "",
        classId: "",
        selectedStudents: [],
        qualification: "",
        subjects: "",
      });
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground">Create accounts for students, teachers, and parents</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Create New User
            </CardTitle>
            <CardDescription>
              School ID is automatically filled from your admin profile. Users will receive their login credentials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value, classId: "", selectedStudents: [] })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Initial Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter secure password"
                    required
                  />
                </div>
              </div>

              {/* Role-specific fields */}
              {formData.role === 'student' && (
                <div className="space-y-2">
                  <Label htmlFor="classId">Class *</Label>
                  <Select value={formData.classId} onValueChange={(value) => setFormData({ ...formData, classId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(cls => (
                        <SelectItem key={cls.class_id} value={cls.class_id}>
                          {cls.class_name} {cls.section && `- ${cls.section}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Select the class this student belongs to
                  </p>
                </div>
              )}

              {formData.role === 'parent' && (
                <div className="space-y-3">
                  <Label>Linked Students *</Label>
                  <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                    {students.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No students available. Create student accounts first.</p>
                    ) : (
                      students.map(student => (
                        <div key={student.student_id} className="flex items-center space-x-2">
                          <Checkbox
                            id={student.student_id}
                            checked={formData.selectedStudents.includes(student.student_id)}
                            onCheckedChange={() => handleStudentToggle(student.student_id)}
                          />
                          <label
                            htmlFor={student.student_id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {student.users.full_name} {student.roll_no && `(Roll: ${student.roll_no})`}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Select one or more students to link to this parent account
                  </p>
                </div>
              )}

              {formData.role === 'teacher' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="classId">Assigned Class (Optional)</Label>
                    <Select value={formData.classId} onValueChange={(value) => setFormData({ ...formData, classId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No specific class</SelectItem>
                        {classes.map(cls => (
                          <SelectItem key={cls.class_id} value={cls.class_id}>
                            {cls.class_name} {cls.section && `- ${cls.section}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="qualification">Qualification</Label>
                    <Input
                      id="qualification"
                      value={formData.qualification}
                      onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                      placeholder="e.g., M.Ed, B.Sc in Mathematics"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subjects">Subjects (comma-separated)</Label>
                    <Input
                      id="subjects"
                      value={formData.subjects}
                      onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                      placeholder="e.g., Mathematics, Physics, Chemistry"
                    />
                    <p className="text-sm text-muted-foreground">
                      Enter subject names separated by commas
                    </p>
                  </div>
                </>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating User...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create User Account
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-sm">Security Notice</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• School ID is automatically assigned from your admin account</li>
              <li>• All account creation actions are logged with admin details and timestamp</li>
              <li>• Users must change their password on first login</li>
              <li>• Public signup is completely disabled for security</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
