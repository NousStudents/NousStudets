import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  CreditCard,
  Receipt,
  AlertCircle,
  CheckCircle,
  Wallet,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import { BackButton } from "@/components/BackButton";

export default function StudentFinancial() {
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
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Financial Portal</h1>
              <p className="text-sm text-muted-foreground">Manage fee payments and records</p>
            </div>
          </div>
        </header>

        {/* Fee Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-none shadow-sm bg-green-500/5">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">₹45,000</p>
                  <p className="text-xs text-muted-foreground">Total Paid</p>
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
                  <p className="text-2xl font-bold text-red-600">₹15,000</p>
                  <p className="text-xs text-muted-foreground">Due by Nov 30</p>
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
                  <p className="text-2xl font-bold text-blue-600">₹60,000</p>
                  <p className="text-xs text-muted-foreground">Annual Fee</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Payments */}
        <Card className="border-none shadow-lg border-red-500/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Pending Payments
            </CardTitle>
            <CardDescription>Outstanding fee installments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 sm:p-5 bg-red-500/5 border border-red-500/10 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Term 2 Tuition Fee</h4>
                    <p className="text-sm text-muted-foreground">Due: November 30, 2025</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-red-600">₹15,000</span>
                  <Button className="shrink-0">
                    Pay Now
                    <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Payment History
            </CardTitle>
            <CardDescription>Your past transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { type: "Term 1 Tuition Fee", amount: "₹15,000", date: "Aug 15, 2025" },
                { type: "Admission Fee", amount: "₹10,000", date: "Jul 1, 2025" },
                { type: "Library Fee", amount: "₹2,000", date: "Jul 1, 2025" },
                { type: "Lab Fee", amount: "₹5,000", date: "Jul 1, 2025" },
                { type: "Sports Fee", amount: "₹3,000", date: "Jul 1, 2025" },
              ].map((payment, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{payment.type}</h4>
                      <p className="text-xs text-muted-foreground">{payment.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{payment.amount}</p>
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs mt-1">
                      Paid
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Payment Methods
            </CardTitle>
            <CardDescription>Choose how to pay</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2 hover:bg-primary/5 hover:border-primary/30"
              >
                <CreditCard className="h-6 w-6" />
                <span className="text-sm">Credit/Debit Card</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2 hover:bg-primary/5 hover:border-primary/30"
              >
                <DollarSign className="h-6 w-6" />
                <span className="text-sm">Net Banking</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2 hover:bg-primary/5 hover:border-primary/30"
              >
                <Receipt className="h-6 w-6" />
                <span className="text-sm">UPI Payment</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
