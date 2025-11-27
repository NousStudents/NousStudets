import { useState } from "react";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AILessonPlanner } from "@/components/ai/AILessonPlanner";
import { AIAssignmentGenerator } from "@/components/ai/AIAssignmentGenerator";
import { AIAttendanceAnalyzer } from "@/components/ai/AIAttendanceAnalyzer";
import { AIReportWriter } from "@/components/ai/AIReportWriter";
import { FileText, FileQuestion, BarChart3, FileEdit } from "lucide-react";

const TeacherAIAssistant = () => {
  const [activeTab, setActiveTab] = useState("lesson-planner");

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              AI Teaching Assistant
            </h1>
            <p className="text-muted-foreground mt-1">
              Powerful AI tools to enhance your teaching workflow
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="lesson-planner" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Lesson Planner</span>
              <span className="sm:hidden">Lessons</span>
            </TabsTrigger>
            <TabsTrigger value="assignment-generator" className="flex items-center gap-2">
              <FileQuestion className="h-4 w-4" />
              <span className="hidden sm:inline">Assignments</span>
              <span className="sm:hidden">Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="attendance-analyzer" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Attendance</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="report-writer" className="flex items-center gap-2">
              <FileEdit className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
              <span className="sm:hidden">Comments</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lesson-planner" className="mt-6">
            <AILessonPlanner />
          </TabsContent>

          <TabsContent value="assignment-generator" className="mt-6">
            <AIAssignmentGenerator />
          </TabsContent>

          <TabsContent value="attendance-analyzer" className="mt-6">
            <AIAttendanceAnalyzer />
          </TabsContent>

          <TabsContent value="report-writer" className="mt-6">
            <AIReportWriter />
          </TabsContent>
        </Tabs>

        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">AI Features Overview</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>📝 <strong>Lesson Planner:</strong> Generate comprehensive lesson plans with activities and outcomes</li>
              <li>📋 <strong>Assignment Generator:</strong> Create questions, MCQs, and full papers with answer keys</li>
              <li>📊 <strong>Attendance Analyzer:</strong> Identify at-risk students and get intervention recommendations</li>
              <li>💬 <strong>Report Writer:</strong> Generate personalized report card comments based on performance</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherAIAssistant;