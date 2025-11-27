import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Users, CreditCard, Receipt, AlertCircle, BarChart3 } from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { useToast } from '@/hooks/use-toast';

export default function AdminFinancial() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingFees: 0,
    collectionRate: 0,
    defaultersCount: 0
  });

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      // Fetch all fees
      const { data: feesData, error: feesError } = await supabase
        .from('fees')
        .select('*');

      if (feesError) throw feesError;

      const totalRevenue = feesData?.filter(f => f.status === 'paid').reduce((sum, fee) => sum + fee.amount, 0) || 0;
      const pendingFees = feesData?.filter(f => f.status === 'pending').reduce((sum, fee) => sum + fee.amount, 0) || 0;
      const totalDue = feesData?.reduce((sum, fee) => sum + fee.amount, 0) || 0;
      const collectionRate = totalDue > 0 ? Math.round((totalRevenue / totalDue) * 100) : 0;
      const defaultersCount = feesData?.filter(f => {
        if (f.status === 'paid' || !f.due_date) return false;
        const daysDiff = Math.floor((new Date().getTime() - new Date(f.due_date).getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff > 30;
      }).length || 0;

      setStats({
        totalRevenue,
        pendingFees,
        collectionRate,
        defaultersCount
      });
    } catch (error: any) {
      console.error('Error fetching financial data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load financial data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financial Management</h1>
          <p className="text-muted-foreground">Comprehensive financial overview and fee management</p>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-pastel-green/30 border-pastel-green/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{(stats.totalRevenue / 100000).toFixed(1)}L</div>
            <p className="text-xs text-success mt-1">Collected this term</p>
          </CardContent>
        </Card>

        <Card className="bg-pastel-coral/30 border-pastel-coral/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Pending Fees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{(stats.pendingFees / 100000).toFixed(1)}L</div>
            <p className="text-xs text-muted-foreground">Yet to collect</p>
          </CardContent>
        </Card>

        <Card className="bg-pastel-blue/30 border-pastel-blue/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Collection Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.collectionRate}%</div>
            <p className="text-xs text-muted-foreground">This term</p>
          </CardContent>
        </Card>

        <Card className="bg-pastel-yellow/30 border-pastel-yellow/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Fee Defaulters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.defaultersCount}</div>
            <p className="text-xs text-muted-foreground">Over 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Fee Collection Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Fee Collection Summary
          </CardTitle>
          <CardDescription>Current term breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { category: 'Tuition Fee', collected: '₹35L', pending: '₹5L', percent: 87 },
              { category: 'Transport Fee', collected: '₹6L', pending: '₹1.5L', percent: 80 },
              { category: 'Lab Fee', collected: '₹2.5L', pending: '₹1L', percent: 71 },
              { category: 'Library Fee', collected: '₹1.7L', pending: '₹1L', percent: 63 }
            ].map((item, i) => (
              <div key={i} className="p-4 bg-muted/50 rounded-lg space-y-3">
                <h4 className="font-semibold">{item.category}</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Collected</span>
                    <span className="font-medium text-success">{item.collected}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pending</span>
                    <span className="font-medium text-destructive">{item.pending}</span>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-success h-2 rounded-full" style={{ width: `${item.percent}%` }} />
                </div>
                <p className="text-xs text-muted-foreground text-right">{item.percent}% collected</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
          <CardDescription>Latest fee payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { student: 'Rahul Kumar', class: 'Grade 10A', amount: '₹15,000', type: 'Tuition Fee', date: '2 hours ago', method: 'UPI' },
              { student: 'Priya Sharma', class: 'Grade 9B', amount: '₹12,000', type: 'Term Fee', date: '5 hours ago', method: 'Card' },
              { student: 'Amit Patel', class: 'Grade 11C', amount: '₹18,000', type: 'Full Payment', date: 'Today', method: 'Net Banking' },
              { student: 'Sneha Singh', class: 'Grade 8A', amount: '₹10,000', type: 'Tuition Fee', date: 'Yesterday', method: 'Cash' }
            ].map((transaction, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <CreditCard className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{transaction.student}</h4>
                    <p className="text-sm text-muted-foreground">{transaction.class} • {transaction.type}</p>
                    <p className="text-xs text-muted-foreground mt-1">{transaction.date} • {transaction.method}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-success">{transaction.amount}</div>
                  <Badge variant="secondary">Paid</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Defaulters List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Fee Defaulters
          </CardTitle>
          <CardDescription>Students with overdue payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { student: 'Vikram Singh', class: 'Grade 12B', amount: '₹25,000', overdue: '45 days' },
              { student: 'Anjali Gupta', class: 'Grade 10C', amount: '₹15,000', overdue: '32 days' },
              { student: 'Karan Malhotra', class: 'Grade 9A', amount: '₹12,000', overdue: '28 days' }
            ].map((defaulter, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div>
                  <h4 className="font-semibold">{defaulter.student}</h4>
                  <p className="text-sm text-muted-foreground">{defaulter.class}</p>
                  <p className="text-xs text-destructive mt-1">Overdue: {defaulter.overdue}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-destructive">{defaulter.amount}</div>
                  <Button size="sm" variant="outline" className="mt-2">Send Reminder</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Financial Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Financial Reports
          </CardTitle>
          <CardDescription>Generate and download reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-24 flex flex-col gap-2">
              <Receipt className="h-8 w-8" />
              <span>Collection Report</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2">
              <TrendingUp className="h-8 w-8" />
              <span>Revenue Analysis</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2">
              <BarChart3 className="h-8 w-8" />
              <span>Expense Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}