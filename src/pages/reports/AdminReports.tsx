import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, FileText, Download, TrendingUp, Users, DollarSign, BookOpen } from 'lucide-react';
import { BackButton } from '@/components/BackButton';

export default function AdminReports() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">Generate comprehensive reports and insights</p>
        </div>
      </div>

      {/* Quick Report Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Button variant="outline" className="h-24 flex flex-col gap-2 border-2">
          <Users className="h-8 w-8" />
          <span className="font-medium">Student Reports</span>
        </Button>
        <Button variant="outline" className="h-24 flex flex-col gap-2 border-2">
          <BookOpen className="h-8 w-8" />
          <span className="font-medium">Academic Reports</span>
        </Button>
        <Button variant="outline" className="h-24 flex flex-col gap-2 border-2">
          <DollarSign className="h-8 w-8" />
          <span className="font-medium">Financial Reports</span>
        </Button>
        <Button variant="outline" className="h-24 flex flex-col gap-2 border-2">
          <TrendingUp className="h-8 w-8" />
          <span className="font-medium">Performance Analytics</span>
        </Button>
      </div>

      {/* Academic Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Academic Reports
          </CardTitle>
          <CardDescription>Student performance and curriculum reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'Class-wise Performance', description: 'Comparative analysis across all classes', icon: BarChart3 },
              { title: 'Subject-wise Analysis', description: 'Performance breakdown by subject', icon: BookOpen },
              { title: 'Attendance Summary', description: 'Student attendance trends', icon: Users },
              { title: 'Exam Results Report', description: 'Comprehensive exam statistics', icon: FileText }
            ].map((report, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <report.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{report.title}</h4>
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-1" />
                  Generate
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Financial Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial Reports
          </CardTitle>
          <CardDescription>Revenue, expenses, and fee collection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'Fee Collection Report', description: 'Term-wise collection summary', icon: DollarSign },
              { title: 'Defaulter List', description: 'Students with pending fees', icon: FileText },
              { title: 'Revenue Analysis', description: 'Income streams breakdown', icon: TrendingUp },
              { title: 'Expense Report', description: 'School expenditure summary', icon: BarChart3 }
            ].map((report, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <report.icon className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{report.title}</h4>
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-1" />
                  Generate
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Operational Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Operational Reports
          </CardTitle>
          <CardDescription>Staff, facilities, and resource utilization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'Teacher Performance', description: 'Faculty evaluation metrics', icon: Users },
              { title: 'Timetable Utilization', description: 'Class and room scheduling efficiency', icon: BookOpen },
              { title: 'Infrastructure Report', description: 'Facilities and resources status', icon: FileText },
              { title: 'Staff Attendance', description: 'Employee attendance records', icon: TrendingUp }
            ].map((report, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <report.icon className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{report.title}</h4>
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-1" />
                  Generate
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Report Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Custom Report Builder
          </CardTitle>
          <CardDescription>Create tailored reports with specific parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>Custom report builder coming soon</p>
            <Button className="mt-4" variant="outline">Build Custom Report</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}