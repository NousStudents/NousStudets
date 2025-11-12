import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, DollarSign, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/hooks/useRole";
import { format } from "date-fns";

interface FeeRecord {
  fee_id: string;
  amount: number;
  due_date: string;
  payment_date: string | null;
  status: string;
}

export default function Fees() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role, loading: roleLoading } = useRole();
  const { toast } = useToast();
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDue: 0,
    totalPaid: 0,
    pending: 0,
    overdue: 0,
  });

  useEffect(() => {
    if (user && !roleLoading) {
      fetchFees();
    }
  }, [user, roleLoading]);

  const fetchFees = async () => {
    try {
      if (role === "student" || role === "parent") {
        let studentId = null;

        if (role === "student") {
          const { data: studentData } = await supabase
            .from("students")
            .select("student_id")
            .eq("auth_user_id", user?.id)
            .single();
          studentId = studentData?.student_id;
        } else if (role === "parent") {
          const { data: parentData } = await supabase
            .from("parents")
            .select("parent_id")
            .eq("auth_user_id", user?.id)
            .single();

          if (parentData) {
            const { data: studentData } = await supabase
              .from("students")
              .select("student_id")
              .eq("parent_id", parentData.parent_id)
              .limit(1)
              .single();
            studentId = studentData?.student_id;
          }
        }

        if (!studentId) return;

        const { data, error } = await supabase
          .from("fees")
          .select("*")
          .eq("student_id", studentId)
          .order("due_date", { ascending: false });

        if (error) throw error;

        const records = data || [];
        setFees(records);

        // Calculate stats
        const totalPaid = records
          .filter(f => f.status === "paid")
          .reduce((sum, f) => sum + Number(f.amount), 0);
        
        const totalDue = records
          .filter(f => f.status !== "paid")
          .reduce((sum, f) => sum + Number(f.amount), 0);

        const pending = records.filter(f => f.status === "pending").length;
        
        const overdue = records.filter(
          f => f.status === "pending" && new Date(f.due_date) < new Date()
        ).length;

        setStats({ totalDue, totalPaid, pending, overdue });
      }
    } catch (error) {
      console.error("Error fetching fees:", error);
      toast({
        title: "Error",
        description: "Failed to load fee records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, dueDate: string) => {
    if (status === "paid") {
      return <Badge className="bg-green-500">Paid</Badge>;
    }
    if (new Date(dueDate) < new Date()) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    return <Badge className="bg-yellow-500">Pending</Badge>;
  };

  if (loading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Fee Management</h1>
            <p className="text-muted-foreground mt-2">
              View and manage your fee payments
            </p>
          </div>

          {(role === "student" || role === "parent") && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Due
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">
                    ${stats.totalDue.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Paid
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">
                    ${stats.totalPaid.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pending
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pending}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Overdue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">{stats.overdue}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {fees.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No fee records found
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {fees.map((fee) => (
                <Card key={fee.fee_id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-muted-foreground" />
                          <span className="text-2xl font-bold">
                            ${Number(fee.amount).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Due: {format(new Date(fee.due_date), "PPP")}</span>
                        </div>
                        {fee.payment_date && (
                          <div className="text-sm text-muted-foreground">
                            Paid on: {format(new Date(fee.payment_date), "PPP")}
                          </div>
                        )}
                      </div>
                      {getStatusBadge(fee.status, fee.due_date)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
