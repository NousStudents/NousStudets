import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminAIInsightsDashboard from "@/components/admin/AdminAIInsightsDashboard";
import AITimetableAutoGenerator from "@/components/admin/AITimetableAutoGenerator";
import AIFeePredictionSystem from "@/components/admin/AIFeePredictionSystem";
import AITeacherPerformanceMonitor from "@/components/admin/AITeacherPerformanceMonitor";
import AIGlobalChatbot from "@/components/admin/AIGlobalChatbot";
import { Brain } from "lucide-react";

export default function AdminAIModule() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">AI Admin Suite</h1>
          <p className="text-muted-foreground">Intelligent insights and automation</p>
        </div>
      </div>

      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="chatbot">Assistant</TabsTrigger>
        </TabsList>

        <TabsContent value="insights">
          <AdminAIInsightsDashboard />
        </TabsContent>

        <TabsContent value="timetable">
          <AITimetableAutoGenerator />
        </TabsContent>

        <TabsContent value="fees">
          <AIFeePredictionSystem />
        </TabsContent>

        <TabsContent value="performance">
          <AITeacherPerformanceMonitor />
        </TabsContent>

        <TabsContent value="chatbot">
          <AIGlobalChatbot />
        </TabsContent>
      </Tabs>
    </div>
  );
}