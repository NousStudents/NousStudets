import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, FileText, Trophy, Calendar, TrendingUp } from 'lucide-react';
import { BackButton } from '@/components/BackButton';

export default function StudentAcademic() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Academic Portal</h1>
          <p className="text-muted-foreground">Your complete academic overview</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-pastel-blue/30 border-pastel-blue/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Total Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">8</div>
          </CardContent>
        </Card>

        <Card className="bg-pastel-mint/30 border-pastel-mint/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">3 pending</p>
          </CardContent>
        </Card>

        <Card className="bg-pastel-yellow/30 border-pastel-yellow/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Average Grade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">A-</div>
          </CardContent>
        </Card>

        <Card className="bg-pastel-peach/30 border-pastel-peach/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Upcoming Exams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">2</div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Subject Performance</CardTitle>
          <CardDescription>Your grades across all subjects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {['Mathematics', 'Physics', 'Chemistry', 'English', 'Computer Science', 'Biology'].map((subject) => (
              <div key={subject} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{subject}</h4>
                    <p className="text-sm text-muted-foreground">Current Grade: A</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">View Details</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Assignments</CardTitle>
          <CardDescription>Track your submission status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { title: 'Calculus Problem Set', subject: 'Mathematics', due: 'Nov 15', status: 'pending' },
              { title: 'Lab Report - Circuits', subject: 'Physics', due: 'Nov 18', status: 'submitted' },
              { title: 'Essay on Shakespeare', subject: 'English', due: 'Nov 20', status: 'graded' }
            ].map((assignment, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <h4 className="font-semibold">{assignment.title}</h4>
                  <p className="text-sm text-muted-foreground">{assignment.subject} • Due: {assignment.due}</p>
                </div>
                <Badge variant={assignment.status === 'pending' ? 'destructive' : assignment.status === 'submitted' ? 'secondary' : 'default'}>
                  {assignment.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Progress Tracker */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Academic Progress
          </CardTitle>
          <CardDescription>Your performance trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>Progress charts coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}