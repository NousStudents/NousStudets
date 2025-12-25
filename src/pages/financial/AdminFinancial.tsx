import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  TrendingUp,
  Users,
  AlertCircle,
  Wallet,
  CheckCircle,
  Clock,
  Plus,
  Pencil,
  Trash2,
  Search,
  Filter,
} from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";
import { format } from "date-fns";

interface Fee {
  fee_id: string;
  student_id: string;
  amount: number;
  status: string | null;
  due_date: string | null;
  payment_date: string | null;
  school_id: string;
  created_at: string | null;
  student?: {
    full_name: string;
    class_id: string | null;
    classes?: {
      class_name: string;
      section: string | null;
    } | null;
  };
}

interface Student {
  student_id: string;
  full_name: string;
  class_id: string | null;
  classes?: {
    class_name: string;
    section: string | null;
  } | null;
}

export default function AdminFinancial() {
  const { toast } = useToast();
  const { schoolId } = useTenant();
  const [loading, setLoading] = useState(true);
  const [fees, setFees] = useState<Fee[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingFees: 0,
    collectionRate: 0,
    defaultersCount: 0,
    totalStudents: 0,
  });

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    student_id: "",
    amount: "",
    status: "pending",
    due_date: "",
    payment_date: "",
  });

  useEffect(() => {
    if (schoolId) {
      fetchData();
    }
  }, [schoolId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch fees with student info
      const { data: feesData, error: feesError } = await supabase
        .from("fees")
        .select(`
          *,
          student:students(
            full_name,
            class_id,
            classes(class_name, section)
          )
        `)
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false });

      if (feesError) throw feesError;

      // Fetch students for dropdown
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select(`
          student_id,
          full_name,
          class_id,
          classes(class_name, section)
        `)
        .order("full_name");

      if (studentsError) throw studentsError;

      setFees(feesData || []);
      setStudents(studentsData || []);

      // Calculate stats
      const totalRevenue = feesData?.filter((f) => f.status === "paid").reduce((sum, fee) => sum + fee.amount, 0) || 0;
      const pendingFees = feesData?.filter((f) => f.status === "pending").reduce((sum, fee) => sum + fee.amount, 0) || 0;
      const totalDue = feesData?.reduce((sum, fee) => sum + fee.amount, 0) || 0;
      const collectionRate = totalDue > 0 ? Math.round((totalRevenue / totalDue) * 100) : 0;
      const defaultersCount = feesData?.filter((f) => {
        if (f.status === "paid" || !f.due_date) return false;
        const daysDiff = Math.floor(
          (new Date().getTime() - new Date(f.due_date).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysDiff > 30;
      }).length || 0;

      setStats({
        totalRevenue,
        pendingFees,
        collectionRate,
        defaultersCount,
        totalStudents: studentsData?.length || 0,
      });
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load financial data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddFee = async () => {
    if (!formData.student_id || !formData.amount) {
      toast({ title: "Error", description: "Please fill required fields", variant: "destructive" });
      return;
    }

    setFormLoading(true);
    try {
      const { error } = await supabase.from("fees").insert({
        student_id: formData.student_id,
        amount: parseFloat(formData.amount),
        status: formData.status,
        due_date: formData.due_date || null,
        payment_date: formData.status === "paid" ? (formData.payment_date || new Date().toISOString().split("T")[0]) : null,
        school_id: schoolId,
      });

      if (error) throw error;

      toast({ title: "Success", description: "Fee added successfully" });
      setIsAddDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error("Error adding fee:", error);
      toast({ title: "Error", description: error.message || "Failed to add fee", variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditFee = async () => {
    if (!selectedFee || !formData.amount) {
      toast({ title: "Error", description: "Please fill required fields", variant: "destructive" });
      return;
    }

    setFormLoading(true);
    try {
      const { error } = await supabase
        .from("fees")
        .update({
          amount: parseFloat(formData.amount),
          status: formData.status,
          due_date: formData.due_date || null,
          payment_date: formData.status === "paid" ? (formData.payment_date || new Date().toISOString().split("T")[0]) : null,
        })
        .eq("fee_id", selectedFee.fee_id);

      if (error) throw error;

      toast({ title: "Success", description: "Fee updated successfully" });
      setIsEditDialogOpen(false);
      setSelectedFee(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error("Error updating fee:", error);
      toast({ title: "Error", description: error.message || "Failed to update fee", variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteFee = async () => {
    if (!selectedFee) return;

    setFormLoading(true);
    try {
      const { error } = await supabase.from("fees").delete().eq("fee_id", selectedFee.fee_id);

      if (error) throw error;

      toast({ title: "Success", description: "Fee deleted successfully" });
      setIsDeleteDialogOpen(false);
      setSelectedFee(null);
      fetchData();
    } catch (error: any) {
      console.error("Error deleting fee:", error);
      toast({ title: "Error", description: error.message || "Failed to delete fee", variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: "",
      amount: "",
      status: "pending",
      due_date: "",
      payment_date: "",
    });
  };

  const openEditDialog = (fee: Fee) => {
    setSelectedFee(fee);
    setFormData({
      student_id: fee.student_id,
      amount: fee.amount.toString(),
      status: fee.status || "pending",
      due_date: fee.due_date || "",
      payment_date: fee.payment_date || "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (fee: Fee) => {
    setSelectedFee(fee);
    setIsDeleteDialogOpen(true);
  };

  // Filter fees
  const filteredFees = fees.filter((fee) => {
    const matchesSearch = fee.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesStatus = statusFilter === "all" || fee.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Get defaulters (overdue > 30 days)
  const defaulters = fees.filter((f) => {
    if (f.status === "paid" || !f.due_date) return false;
    const daysDiff = Math.floor(
      (new Date().getTime() - new Date(f.due_date).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysDiff > 30;
  });

  // Get recent payments
  const recentPayments = fees
    .filter((f) => f.status === "paid")
    .slice(0, 5);

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  const getOverdueDays = (dueDate: string) => {
    return Math.floor((new Date().getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <BackButton />
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Financial Management</h1>
                <p className="text-sm text-muted-foreground">Manage student fees and payments</p>
              </div>
            </div>
          </div>
          <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Fee
          </Button>
        </header>

        {/* Financial Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm bg-green-500/5">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">
                    {formatCurrency(stats.totalRevenue)}
                  </p>
                  <p className="text-xs text-muted-foreground">Collected</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-red-500/5">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-red-600">
                    {formatCurrency(stats.pendingFees)}
                  </p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-blue-500/5">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <DollarSign className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">{stats.collectionRate}%</p>
                  <p className="text-xs text-muted-foreground">Collection Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-amber-500/5">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-amber-600">{stats.defaultersCount}</p>
                  <p className="text-xs text-muted-foreground">Defaulters</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All Fees Table */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  All Fees ({filteredFees.length})
                </CardTitle>
                <CardDescription>Manage student fee records</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search student..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-full sm:w-48"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredFees.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {fees.length === 0 ? "No fee records found. Add your first fee." : "No matching records found."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Payment Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFees.map((fee) => (
                      <TableRow key={fee.fee_id}>
                        <TableCell className="font-medium">{fee.student?.full_name || "Unknown"}</TableCell>
                        <TableCell>
                          {fee.student?.classes 
                            ? `${fee.student.classes.class_name}${fee.student.classes.section ? ` - ${fee.student.classes.section}` : ""}`
                            : "-"}
                        </TableCell>
                        <TableCell className="font-semibold">₹{fee.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={fee.status === "paid" ? "default" : "secondary"}
                            className={fee.status === "paid" 
                              ? "bg-green-500/10 text-green-600 border-green-500/20" 
                              : "bg-amber-500/10 text-amber-600 border-amber-500/20"}
                          >
                            {fee.status === "paid" ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                            {fee.status || "pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>{fee.due_date ? format(new Date(fee.due_date), "dd MMM yyyy") : "-"}</TableCell>
                        <TableCell>{fee.payment_date ? format(new Date(fee.payment_date), "dd MMM yyyy") : "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" onClick={() => openEditDialog(fee)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => openDeleteDialog(fee)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        {recentPayments.length > 0 && (
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Recent Payments
              </CardTitle>
              <CardDescription>Latest fee collections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentPayments.map((fee) => (
                  <div key={fee.fee_id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{fee.student?.full_name || "Unknown"}</h4>
                        <p className="text-xs text-muted-foreground">
                          {fee.student?.classes 
                            ? `${fee.student.classes.class_name}${fee.student.classes.section ? ` - ${fee.student.classes.section}` : ""}`
                            : "No class"}
                        </p>
                        {fee.payment_date && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Paid on {format(new Date(fee.payment_date), "dd MMM yyyy")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-green-600">₹{fee.amount.toLocaleString()}</p>
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                        Paid
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Defaulters List */}
        {defaulters.length > 0 && (
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Fee Defaulters ({defaulters.length})
              </CardTitle>
              <CardDescription>Students with payments overdue by more than 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {defaulters.map((fee) => (
                  <div
                    key={fee.fee_id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-red-500/5 border border-red-500/10 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-red-500" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{fee.student?.full_name || "Unknown"}</h4>
                        <p className="text-xs text-muted-foreground">
                          {fee.student?.classes 
                            ? `${fee.student.classes.class_name}${fee.student.classes.section ? ` - ${fee.student.classes.section}` : ""}`
                            : "No class"}
                        </p>
                        <p className="text-xs text-red-500 mt-0.5">
                          Overdue: {getOverdueDays(fee.due_date!)} days
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-semibold text-red-600">₹{fee.amount.toLocaleString()}</span>
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(fee)}>
                        Mark as Paid
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Fee Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Fee</DialogTitle>
              <DialogDescription>Create a new fee record for a student</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Student *</Label>
                <Select value={formData.student_id} onValueChange={(v) => setFormData({ ...formData, student_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.student_id} value={student.student_id}>
                        {student.full_name} {student.classes ? `(${student.classes.class_name})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount (₹) *</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              {formData.status === "paid" && (
                <div className="space-y-2">
                  <Label>Payment Date</Label>
                  <Input
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddFee} disabled={formLoading}>
                {formLoading ? "Adding..." : "Add Fee"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Fee Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Fee</DialogTitle>
              <DialogDescription>Update fee details for {selectedFee?.student?.full_name}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Amount (₹) *</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              {formData.status === "paid" && (
                <div className="space-y-2">
                  <Label>Payment Date</Label>
                  <Input
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleEditFee} disabled={formLoading}>
                {formLoading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Fee</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this fee record for {selectedFee?.student?.full_name}? 
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteFee} disabled={formLoading}>
                {formLoading ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
