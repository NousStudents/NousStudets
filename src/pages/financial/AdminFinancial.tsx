import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  Receipt,
  AlertCircle,
  BarChart3,
  Wallet,
  ArrowUpRight,
  CheckCircle,
  Clock,
} from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { useToast } from "@/hooks/use-toast";

export default function AdminFinancial() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingFees: 0,
    collectionRate: 0,
    defaultersCount: 0,
  });

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      const { data: feesData, error: feesError } = await supabase.from("fees").select("*");

      if (feesError) throw feesError;

      const totalRevenue =
        feesData?.filter((f) => f.status === "paid").reduce((sum, fee) => sum + fee.amount, 0) || 0;
      const pendingFees =
        feesData?.filter((f) => f.status === "pending").reduce((sum, fee) => sum + fee.amount, 0) || 0;
      const totalDue = feesData?.reduce((sum, fee) => sum + fee.amount, 0) || 0;
      const collectionRate = totalDue > 0 ? Math.round((totalRevenue / totalDue) * 100) : 0;
      const defaultersCount =
        feesData?.filter((f) => {
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
      });
    } catch (error: any) {
      console.error("Error fetching financial data:", error);
      toast({
        title: "Error",
        description: "Failed to load financial data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <header className="flex items-center gap-4">
          <BackButton />
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Financial Management</h1>
              <p className="text-sm text-muted-foreground">Comprehensive fee overview</p>
            </div>
          </div>
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
                    ₹{(stats.totalRevenue / 100000).toFixed(1)}L
                  </p>
                  <p className="text-xs text-muted-foreground">Revenue</p>
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
                    ₹{(stats.pendingFees / 100000).toFixed(1)}L
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
                  <p className="text-xs text-muted-foreground">Collection</p>
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

        {/* Fee Collection Summary */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Fee Collection Summary
            </CardTitle>
            <CardDescription>Current term breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { category: "Tuition Fee", collected: "₹35L", pending: "₹5L", percent: 87 },
                { category: "Transport Fee", collected: "₹6L", pending: "₹1.5L", percent: 80 },
                { category: "Lab Fee", collected: "₹2.5L", pending: "₹1L", percent: 71 },
                { category: "Library Fee", collected: "₹1.7L", pending: "₹1L", percent: 63 },
              ].map((item, i) => (
                <div key={i} className="p-4 bg-muted/30 rounded-xl space-y-3">
                  <h4 className="font-medium text-foreground">{item.category}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Collected</span>
                      <span className="font-medium text-green-600">{item.collected}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pending</span>
                      <span className="font-medium text-red-600">{item.pending}</span>
                    </div>
                  </div>
                  <Progress value={item.percent} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right">{item.percent}% collected</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Recent Transactions
            </CardTitle>
            <CardDescription>Latest fee payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { student: "Rahul Kumar", cls: "Grade 10A", amount: "₹15,000", type: "Tuition Fee", date: "2h ago", method: "UPI" },
                { student: "Priya Sharma", cls: "Grade 9B", amount: "₹12,000", type: "Term Fee", date: "5h ago", method: "Card" },
                { student: "Amit Patel", cls: "Grade 11C", amount: "₹18,000", type: "Full Payment", date: "Today", method: "Net Banking" },
                { student: "Sneha Singh", cls: "Grade 8A", amount: "₹10,000", type: "Tuition Fee", date: "Yesterday", method: "Cash" },
              ].map((tx, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{tx.student}</h4>
                      <p className="text-xs text-muted-foreground">
                        {tx.cls} • {tx.type}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {tx.date} • {tx.method}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-green-600">{tx.amount}</p>
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                      Paid
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Defaulters List */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Fee Defaulters
            </CardTitle>
            <CardDescription>Students with overdue payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { student: "Vikram Singh", cls: "Grade 12B", amount: "₹25,000", overdue: "45 days" },
                { student: "Anjali Gupta", cls: "Grade 10C", amount: "₹15,000", overdue: "32 days" },
                { student: "Karan Malhotra", cls: "Grade 9A", amount: "₹12,000", overdue: "28 days" },
              ].map((d, i) => (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-red-500/5 border border-red-500/10 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{d.student}</h4>
                      <p className="text-xs text-muted-foreground">{d.cls}</p>
                      <p className="text-xs text-red-500 mt-0.5">Overdue: {d.overdue}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-semibold text-red-600">{d.amount}</span>
                    <Button size="sm" variant="outline">
                      Send Reminder
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Financial Reports */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Financial Reports
            </CardTitle>
            <CardDescription>Generate and download reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2 hover:bg-primary/5 hover:border-primary/30"
              >
                <Receipt className="h-6 w-6" />
                <span className="text-sm">Collection Report</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2 hover:bg-primary/5 hover:border-primary/30"
              >
                <TrendingUp className="h-6 w-6" />
                <span className="text-sm">Revenue Analysis</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2 hover:bg-primary/5 hover:border-primary/30"
              >
                <BarChart3 className="h-6 w-6" />
                <span className="text-sm">Expense Report</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
