import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, CreditCard, Receipt, AlertCircle, CheckCircle } from 'lucide-react';
import { BackButton } from '@/components/BackButton';

export default function StudentFinancial() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financial Portal</h1>
          <p className="text-muted-foreground">Manage your fee payments and financial records</p>
        </div>
      </div>

      {/* Fee Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-pastel-green/30 border-pastel-green/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹45,000</div>
          </CardContent>
        </Card>

        <Card className="bg-pastel-coral/30 border-pastel-coral/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹15,000</div>
            <p className="text-xs text-muted-foreground">Due by Nov 30</p>
          </CardContent>
        </Card>

        <Card className="bg-pastel-blue/30 border-pastel-blue/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Fee
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹60,000</div>
            <p className="text-xs text-muted-foreground">Annual</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Pending Payments
          </CardTitle>
          <CardDescription>Outstanding fee installments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div>
                <h4 className="font-semibold">Term 2 Tuition Fee</h4>
                <p className="text-sm text-muted-foreground">Due: November 30, 2025</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-destructive">₹15,000</div>
                <Button size="sm" className="mt-2">Pay Now</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Payment History
          </CardTitle>
          <CardDescription>Your past transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { type: 'Term 1 Tuition Fee', amount: '₹15,000', date: 'Aug 15, 2025', status: 'paid' },
              { type: 'Admission Fee', amount: '₹10,000', date: 'Jul 1, 2025', status: 'paid' },
              { type: 'Library Fee', amount: '₹2,000', date: 'Jul 1, 2025', status: 'paid' },
              { type: 'Lab Fee', amount: '₹5,000', date: 'Jul 1, 2025', status: 'paid' },
              { type: 'Sports Fee', amount: '₹3,000', date: 'Jul 1, 2025', status: 'paid' }
            ].map((payment, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{payment.type}</h4>
                    <p className="text-sm text-muted-foreground">{payment.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{payment.amount}</div>
                  <Badge variant="secondary" className="mt-1">{payment.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Methods
          </CardTitle>
          <CardDescription>Manage your payment options</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-24 flex flex-col gap-2">
              <CreditCard className="h-8 w-8" />
              <span>Credit/Debit Card</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2">
              <DollarSign className="h-8 w-8" />
              <span>Net Banking</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2">
              <Receipt className="h-8 w-8" />
              <span>UPI Payment</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}