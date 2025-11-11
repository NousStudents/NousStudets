import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Shield, AlertCircle } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { MobileAdminRestriction } from "@/components/MobileAdminRestriction";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [adminSchoolId, setAdminSchoolId] = useState("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [errorDialog, setErrorDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    details?: string;
    showCleanupButton: boolean;
  }>({
    open: false,
    title: "",
    description: "",
    details: "",
    showCleanupButton: false,
  });
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "",
    password: "",
    // Student fields
    classId: "",
    section: "",
    rollNo: "",
    dob: "",
    gender: "",
    admissionDate: "",
    // Teacher fields
    qualification: "",
    experience: "",
    subjectSpecialization: "",
    // Parent fields
    selectedStudents: [] as string[],
    relation: "",
    occupation: "",
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
      const { data: userData, error } = await supabase
        .from('users')
        .select('school_id')
        .eq('auth_user_id', user?.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching admin data:', error);
        toast({
          title: "Error",
          description: "Failed to load admin profile. Please refresh the page.",
          variant: "destructive",
        });
        return;
      }

      if (!userData) {
        toast({
          title: "Profile Not Found",
          description: "Your admin profile is not set up. Please contact support.",
          variant: "destructive",
        });
        return;
      }
      
      if (userData.school_id) {
        setAdminSchoolId(userData.school_id);
      } else {
        toast({
          title: "School Not Assigned",
          description: "Your admin account is not linked to a school.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
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
    if (!adminSchoolId) {
      console.log('No school ID available, skipping student fetch');
      setStudents([]);
      return;
    }

    try {
      const { data, error } = await supabase
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
      
      if (error) {
        console.error('Error fetching students:', error);
        toast({
          title: "Error",
          description: "Failed to load students list.",
          variant: "destructive",
        });
        return;
      }

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

    if (formData.role === 'parent') {
      if (!formData.relation) {
        toast({
          title: "Validation Error",
          description: "Please select the parent's relation",
          variant: "destructive",
        });
        return;
      }
      if (formData.selectedStudents.length === 0) {
        toast({
          title: "Validation Error",
          description: "Please link at least one student to the parent",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    try {
      // Get the current session to ensure we have a valid token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Your session has expired. Please log in again.');
      }

      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone || null,
          role: formData.role,
          password: formData.password,
          schoolId: adminSchoolId,
          // Student fields
          classId: formData.classId || null,
          section: formData.section || null,
          rollNo: formData.rollNo || null,
          dob: formData.dob || null,
          gender: formData.gender || null,
          admissionDate: formData.admissionDate || null,
          // Teacher fields
          qualification: formData.qualification || null,
          experience: formData.experience ? parseInt(formData.experience) : null,
          subjectSpecialization: formData.subjectSpecialization || null,
          // Parent fields
          linkedStudents: formData.selectedStudents,
          relation: formData.relation || null,
          occupation: formData.occupation || null,
          sendPasswordResetEmail: false,
        },
      });

      // Check for errors from the edge function
      if (error) {
        throw new Error(error.message || "Failed to create user");
      }

      // Check for error in the response data
      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Success",
        description: `User ${formData.email} created successfully`,
      });

      // Reset form
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        role: "",
        password: "",
        classId: "",
        section: "",
        rollNo: "",
        dob: "",
        gender: "",
        admissionDate: "",
        qualification: "",
        experience: "",
        subjectSpecialization: "",
        selectedStudents: [],
        relation: "",
        occupation: "",
      });
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      // Check if it's a duplicate email error
      const isDuplicateError = error.message?.includes("already exists") || 
                               error.message?.includes("duplicate key") ||
                               error.message?.includes("users_email_key");
      
      setErrorDialog({
        open: true,
        title: isDuplicateError ? "Duplicate Email Detected" : "Error Creating User",
        description: isDuplicateError 
          ? `A user with the email "${formData.email}" already exists in the database.`
          : "An error occurred while creating the user.",
        details: error.message || "Failed to create user",
        showCleanupButton: isDuplicateError,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AlertDialog open={errorDialog.open} onOpenChange={(open) => setErrorDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              {errorDialog.title}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>{errorDialog.description}</p>
              {errorDialog.details && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm font-mono text-muted-foreground">{errorDialog.details}</p>
                </div>
              )}
              {errorDialog.showCleanupButton && (
                <p className="text-sm font-medium">
                  This may be due to orphaned records in the database. Use the Database Cleanup Utility to resolve this issue.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            {errorDialog.showCleanupButton && (
              <AlertDialogAction onClick={() => navigate("/admin/cleanup")}>
                Open Cleanup Utility
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <BackButton to="/dashboard" />
          <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">User Management</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Create accounts for students, teachers, and parents</p>
          </div>
        </div>

        <MobileAdminRestriction action="create and manage users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
                Create New User
              </CardTitle>
              <CardDescription className="text-sm">
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
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
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
                  <PasswordInput
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter secure password"
                    required
                  />
                </div>
              </div>

              {/* Role-specific fields */}
              {formData.role === 'student' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="classId">Class *</Label>
                      <Select value={formData.classId} onValueChange={(value) => setFormData({ ...formData, classId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map(cls => (
                            <SelectItem key={cls.class_id} value={cls.class_id}>
                              {cls.class_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="section">Section</Label>
                      <Input
                        id="section"
                        value={formData.section}
                        onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                        placeholder="e.g., A, B, C"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rollNo">Roll Number</Label>
                      <Input
                        id="rollNo"
                        value={formData.rollNo}
                        onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                        placeholder="Enter roll number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of Birth</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="admissionDate">Admission Date</Label>
                      <Input
                        id="admissionDate"
                        type="date"
                        value={formData.admissionDate}
                        onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.role === 'parent' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="relation">Relation *</Label>
                      <Select value={formData.relation} onValueChange={(value) => setFormData({ ...formData, relation: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select relation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Father">Father</SelectItem>
                          <SelectItem value="Mother">Mother</SelectItem>
                          <SelectItem value="Guardian">Guardian</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="occupation">Occupation</Label>
                      <Input
                        id="occupation"
                        value={formData.occupation}
                        onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                        placeholder="Enter occupation"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Linked Students *</Label>
                    {!adminSchoolId ? (
                      <div className="border border-destructive rounded-lg p-4">
                        <p className="text-sm text-destructive">Unable to load students. Please refresh the page.</p>
                      </div>
                    ) : (
                      <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                        {students.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No students available in your school. Create student accounts first.
                          </p>
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
                    )}
                    <p className="text-sm text-muted-foreground">
                      Select one or more students to link to this parent account.
                    </p>
                  </div>
                </div>
              )}

              {formData.role === 'teacher' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <Label htmlFor="experience">Experience (Years)</Label>
                      <Input
                        id="experience"
                        type="number"
                        value={formData.experience}
                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                        placeholder="Years of experience"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="subjectSpecialization">Subject Specialization</Label>
                      <Input
                        id="subjectSpecialization"
                        value={formData.subjectSpecialization}
                        onChange={(e) => setFormData({ ...formData, subjectSpecialization: e.target.value })}
                        placeholder="e.g., Mathematics, Physics, Chemistry"
                      />
                    </div>
                  </div>
                </div>
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
        </MobileAdminRestriction>
      </div>
    </div>
    </>
  );
}
