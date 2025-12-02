import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { 
  Loader2, LogOut, School, Users, GraduationCap, UserCheck, 
  ChevronDown, ChevronRight, Search, Building2, Shield, RefreshCw,
  Mail, Phone, MapPin, Globe
} from "lucide-react";

interface SchoolData {
  school_id: string;
  school_name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  website: string | null;
}

interface UserData {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: string | null;
}

interface SchoolStats {
  admins: UserData[];
  teachers: UserData[];
  students: UserData[];
  parents: UserData[];
}

export default function SuperAdminProfile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isSuperAdmin, loading: superAdminLoading } = useSuperAdmin();
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [schoolStats, setSchoolStats] = useState<Record<string, SchoolStats>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSchools, setExpandedSchools] = useState<Set<string>>(new Set());
  const [superAdminInfo, setSuperAdminInfo] = useState<{ full_name: string; email: string } | null>(null);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchData();
      fetchSuperAdminInfo();
    }
  }, [isSuperAdmin]);

  const fetchSuperAdminInfo = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("super_admins")
      .select("full_name, email")
      .eq("auth_user_id", user.id)
      .single();
    
    if (data) {
      setSuperAdminInfo(data);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all schools
      const { data: schoolsData, error: schoolsError } = await supabase
        .from("schools")
        .select("school_id, school_name, email, phone, city, state, website")
        .order("school_name");

      if (schoolsError) throw schoolsError;
      setSchools(schoolsData || []);

      // Fetch users for each school
      const stats: Record<string, SchoolStats> = {};
      
      for (const school of schoolsData || []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sb = supabase as any;
        const adminsRes = await sb.from("admins").select("*").eq("school_id", school.school_id);
        const teachersRes = await sb.from("teachers").select("*").eq("school_id", school.school_id);
        const studentsRes = await sb.from("students").select("*").eq("school_id", school.school_id);
        const parentsRes = await sb.from("parents").select("*").eq("school_id", school.school_id);

        stats[school.school_id] = {
          admins: (adminsRes.data || []).map((a: any) => ({ id: a.admin_id, full_name: a.full_name, email: a.email, phone: a.phone, status: a.status })),
          teachers: (teachersRes.data || []).map((t: any) => ({ id: t.teacher_id, full_name: t.full_name, email: t.email, phone: t.phone, status: t.status })),
          students: (studentsRes.data || []).map((s: any) => ({ id: s.student_id, full_name: s.full_name, email: s.email, phone: s.phone, status: s.status })),
          parents: (parentsRes.data || []).map((p: any) => ({ id: p.parent_id, full_name: p.full_name, email: p.email, phone: p.phone, status: p.status })),
        };
      }
      
      setSchoolStats(stats);
    } catch (error: any) {
      toast.error("Failed to fetch data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSchool = (schoolId: string) => {
    setExpandedSchools(prev => {
      const newSet = new Set(prev);
      if (newSet.has(schoolId)) {
        newSet.delete(schoolId);
      } else {
        newSet.add(schoolId);
      }
      return newSet;
    });
  };

  const filteredSchools = schools.filter(school =>
    school.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.state?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTotalUsers = () => {
    let total = { admins: 0, teachers: 0, students: 0, parents: 0 };
    Object.values(schoolStats).forEach(stats => {
      total.admins += stats.admins.length;
      total.teachers += stats.teachers.length;
      total.students += stats.students.length;
      total.parents += stats.parents.length;
    });
    return total;
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/super-admin/login");
  };

  if (superAdminLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to access this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/super-admin/login")}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totals = getTotalUsers();

  const UserCard = ({ user, role }: { user: UserData; role: string }) => (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium text-primary">
            {user.full_name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{user.full_name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
      </div>
      <Badge variant={user.status === "active" ? "default" : "secondary"} className="flex-shrink-0">
        {user.status || "active"}
      </Badge>
    </div>
  );

  const UserSection = ({ title, users, icon: Icon, emptyMessage }: { 
    title: string; 
    users: UserData[]; 
    icon: React.ElementType;
    emptyMessage: string;
  }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h4 className="font-medium text-sm">{title}</h4>
        <Badge variant="outline" className="ml-auto">{users.length}</Badge>
      </div>
      {users.length > 0 ? (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {users.map(user => (
            <UserCard key={user.id} user={user} role={title} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic py-2">{emptyMessage}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {superAdminInfo?.full_name || "Super Admin"}
                </h1>
                <p className="text-sm text-muted-foreground">{superAdminInfo?.email || user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/super-admin")}>
                <Building2 className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button variant="destructive" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <School className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{schools.length}</p>
                  <p className="text-xs text-muted-foreground">Schools</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <UserCheck className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{totals.admins}</p>
                  <p className="text-xs text-muted-foreground">Admins</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{totals.teachers}</p>
                  <p className="text-xs text-muted-foreground">Teachers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{totals.students}</p>
                  <p className="text-xs text-muted-foreground">Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 border-pink-500/20 col-span-2 md:col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-pink-500" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{totals.parents}</p>
                  <p className="text-xs text-muted-foreground">Parents</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search schools by name, city, or state..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Schools List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            All Schools ({filteredSchools.length})
          </h2>

          {filteredSchools.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <School className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? "No schools match your search" : "No schools found"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredSchools.map(school => {
                const stats = schoolStats[school.school_id] || { admins: [], teachers: [], students: [], parents: [] };
                const isExpanded = expandedSchools.has(school.school_id);
                const totalUsers = stats.admins.length + stats.teachers.length + stats.students.length + stats.parents.length;

                return (
                  <Collapsible key={school.school_id} open={isExpanded} onOpenChange={() => toggleSchool(school.school_id)}>
                    <Card className="overflow-hidden">
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                                <School className="h-5 w-5 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <CardTitle className="text-base truncate">{school.school_name}</CardTitle>
                                <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                  {school.city && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {school.city}{school.state && `, ${school.state}`}
                                    </span>
                                  )}
                                  {school.email && (
                                    <span className="flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {school.email}
                                    </span>
                                  )}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <Badge variant="secondary">{totalUsers} users</Badge>
                              {isExpanded ? (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <Tabs defaultValue="admins" className="w-full">
                            <TabsList className="grid w-full grid-cols-4 mb-4">
                              <TabsTrigger value="admins" className="text-xs sm:text-sm">
                                Admins ({stats.admins.length})
                              </TabsTrigger>
                              <TabsTrigger value="teachers" className="text-xs sm:text-sm">
                                Teachers ({stats.teachers.length})
                              </TabsTrigger>
                              <TabsTrigger value="students" className="text-xs sm:text-sm">
                                Students ({stats.students.length})
                              </TabsTrigger>
                              <TabsTrigger value="parents" className="text-xs sm:text-sm">
                                Parents ({stats.parents.length})
                              </TabsTrigger>
                            </TabsList>
                            <TabsContent value="admins">
                              <UserSection 
                                title="Administrators" 
                                users={stats.admins} 
                                icon={UserCheck}
                                emptyMessage="No administrators assigned"
                              />
                            </TabsContent>
                            <TabsContent value="teachers">
                              <UserSection 
                                title="Teachers" 
                                users={stats.teachers} 
                                icon={Users}
                                emptyMessage="No teachers registered"
                              />
                            </TabsContent>
                            <TabsContent value="students">
                              <UserSection 
                                title="Students" 
                                users={stats.students} 
                                icon={GraduationCap}
                                emptyMessage="No students enrolled"
                              />
                            </TabsContent>
                            <TabsContent value="parents">
                              <UserSection 
                                title="Parents" 
                                users={stats.parents} 
                                icon={Users}
                                emptyMessage="No parents registered"
                              />
                            </TabsContent>
                          </Tabs>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
