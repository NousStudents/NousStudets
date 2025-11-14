import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { BackButton } from "@/components/BackButton";
import { Users, Edit, Trash2, Filter, UserPlus, Link as LinkIcon } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EditParentDialog } from "@/components/admin/EditParentDialog";

interface Parent {
  parent_id: string;
  auth_user_id: string;
  full_name: string;
  email: string;
  phone: string;
  relation: string;
  occupation: string;
  status: string;
  children: Array<{ student_id: string; full_name: string; roll_no: string; class_name: string }>;
}

interface Student {
  student_id: string;
  full_name: string;
  roll_no: string;
  class_name: string;
  current_parent_id?: string;
}

export default function ParentManagement() {
  const { user } = useAuth();
  const [parents, setParents] = useState<Parent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [filters, setFilters] = useState({
    relation: "all",
    status: "all",
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const { data: adminData } = await supabase
        .from("admins")
        .select("school_id")
        .eq("auth_user_id", user?.id)
        .single();

      if (!adminData?.school_id) {
        toast.error("School information not found");
        setLoading(false);
        return;
      }

      // Fetch parents directly
      const { data: parentsData, error: parentsError } = await supabase
        .from("parents")
        .select("*")
        .eq("school_id", adminData.school_id);

      if (parentsError) {
        console.error("Parents query error:", parentsError);
        toast.error(`Failed to fetch parents: ${parentsError.message}`);
      }

      // Fetch all students for linking
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select(`
          student_id,
          parent_id,
          full_name,
          roll_no,
          class_id,
          classes (
            class_name,
            school_id
          )
        `);

      if (studentsError) {
        console.error("Students query error:", studentsError);
      }

      // Map students by parent_id
      const studentsByParent = new Map<string, any[]>();
      const allStudents: Student[] = [];

      if (studentsData) {
        studentsData.forEach((s: any) => {
          const student = {
            student_id: s.student_id,
            full_name: s.full_name || "N/A",
            roll_no: s.roll_no || "N/A",
            class_name: s.classes?.class_name || "N/A",
            current_parent_id: s.parent_id,
          };
          allStudents.push(student);

          if (s.parent_id) {
            const existing = studentsByParent.get(s.parent_id) || [];
            existing.push(student);
            studentsByParent.set(s.parent_id, existing);
          }
        });
      }

      setStudents(allStudents);

      if (parentsData) {
        const formattedParents = parentsData.map((p: any) => ({
          parent_id: p.parent_id,
          auth_user_id: p.auth_user_id,
          full_name: p.full_name || "N/A",
          email: p.email || "N/A",
          phone: p.phone || "N/A",
          relation: p.relation || "N/A",
          occupation: p.occupation || "N/A",
          status: p.status || "inactive",
          children: studentsByParent.get(p.parent_id) || [],
        }));
        setParents(formattedParents);
      } else {
        setParents([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load parents");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedParent) return;

    try {
      // First unlink all students
      const { error: unlinkError } = await supabase
        .from("students")
        .update({ parent_id: null })
        .eq("parent_id", selectedParent.parent_id);

      if (unlinkError) throw unlinkError;

      // Delete parent record (auth deletion handled by trigger)
      const { error } = await supabase
        .from("parents")
        .delete()
        .eq("parent_id", selectedParent.parent_id);

      if (error) throw error;
      toast.success("Parent deleted successfully");
      fetchData();
      setDeleteDialogOpen(false);
      setSelectedParent(null);
    } catch (error: any) {
      toast.error(`Failed to delete parent: ${error.message}`);
    }
  };

  const handleStatusToggle = async (parent: Parent) => {
    try {
      const newStatus = parent.status === "active" ? "inactive" : "active";
      const { error } = await supabase
        .from("parents")
        .update({ status: newStatus })
        .eq("parent_id", parent.parent_id);

      if (error) throw error;
      toast.success(`Parent ${newStatus === "active" ? "activated" : "deactivated"}`);
      fetchData();
    } catch (error: any) {
      toast.error(`Failed to update status: ${error.message}`);
    }
  };

  const handleLinkStudents = (parent: Parent) => {
    setSelectedParent(parent);
    setSelectedStudents(parent.children.map(c => c.student_id));
    setLinkDialogOpen(true);
  };

  const handleSaveLinks = async () => {
    if (!selectedParent) return;

    try {
      // Unlink all students currently linked to this parent
      const { error: unlinkError } = await supabase
        .from("students")
        .update({ parent_id: null })
        .eq("parent_id", selectedParent.parent_id);

      if (unlinkError) throw unlinkError;

      // Link selected students
      if (selectedStudents.length > 0) {
        const { error: linkError } = await supabase
          .from("students")
          .update({ parent_id: selectedParent.parent_id })
          .in("student_id", selectedStudents);

        if (linkError) throw linkError;
      }

      toast.success("Student links updated successfully");
      fetchData();
      setLinkDialogOpen(false);
    } catch (error: any) {
      toast.error(`Failed to update links: ${error.message}`);
    }
  };

  const filteredParents = parents.filter((p) => {
    if (filters.relation !== "all" && p.relation !== filters.relation) return false;
    if (filters.status !== "all" && p.status !== filters.status) return false;
    if (searchTerm && !p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !p.email.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <BackButton />
      <div className="flex items-center justify-between mb-6 mt-4">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Parent Management</h1>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Relation</Label>
              <Select value={filters.relation} onValueChange={(v) => setFilters({ ...filters, relation: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Father">Father</SelectItem>
                  <SelectItem value="Mother">Mother</SelectItem>
                  <SelectItem value="Guardian">Guardian</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => {
                setFilters({ relation: "all", status: "all" });
                setSearchTerm("");
              }}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Parents ({filteredParents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Relation</TableHead>
                <TableHead>Occupation</TableHead>
                <TableHead>Children</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParents.map((parent) => (
                <TableRow key={parent.parent_id}>
                  <TableCell className="font-medium">{parent.full_name}</TableCell>
                  <TableCell>{parent.email}</TableCell>
                  <TableCell>{parent.phone}</TableCell>
                  <TableCell>{parent.relation}</TableCell>
                  <TableCell>{parent.occupation}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {parent.children.length > 0 ? (
                        parent.children.map((child) => (
                          <Badge key={child.student_id} variant="secondary" className="text-xs">
                            {child.full_name} ({child.roll_no})
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">No children</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant={parent.status === "active" ? "default" : "secondary"}
                      onClick={() => handleStatusToggle(parent)}
                    >
                      {parent.status}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleLinkStudents(parent)}
                        title="Link Students"
                      >
                        <LinkIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedParent(parent);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedParent(parent);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Link Students Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Link Students to {selectedParent?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-96 overflow-y-auto space-y-2">
              {students.map((student) => (
                <div key={student.student_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedStudents.includes(student.student_id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedStudents([...selectedStudents, student.student_id]);
                        } else {
                          setSelectedStudents(selectedStudents.filter(id => id !== student.student_id));
                        }
                      }}
                    />
                    <div>
                      <p className="font-medium">{student.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Roll: {student.roll_no} | Class: {student.class_name}
                        {student.current_parent_id && student.current_parent_id !== selectedParent?.parent_id && (
                          <Badge variant="outline" className="ml-2">Already linked</Badge>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveLinks}>
                Save Links
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <EditParentDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        parent={selectedParent}
        onSuccess={fetchData}
      />

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Parent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedParent?.full_name}? This will unlink all their children and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
