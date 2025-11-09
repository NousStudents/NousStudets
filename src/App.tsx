import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Timetable from "./pages/Timetable";
import Assignments from "./pages/Assignments";
import Exams from "./pages/Exams";
import Attendance from "./pages/Attendance";
import Fees from "./pages/Fees";
import UserManagement from "./pages/admin/UserManagement";
import TimetableManagement from "./pages/admin/TimetableManagement";
import SchoolManagement from "./pages/admin/SchoolManagement";
import StudentManagement from "./pages/admin/StudentManagement";
import ClassManagement from "./pages/admin/ClassManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute roles={["admin", "teacher", "student", "parent"]}>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/timetable" 
              element={
                <ProtectedRoute roles={["admin", "teacher", "student", "parent"]}>
                  <Timetable />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/assignments" 
              element={
                <ProtectedRoute roles={["admin", "teacher", "student"]}>
                  <Assignments />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/exams" 
              element={
                <ProtectedRoute roles={["admin", "teacher", "student", "parent"]}>
                  <Exams />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/attendance" 
              element={
                <ProtectedRoute roles={["admin", "teacher", "student", "parent"]}>
                  <Attendance />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/fees" 
              element={
                <ProtectedRoute roles={["admin", "student", "parent"]}>
                  <Fees />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/timetable"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <TimetableManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/school"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <SchoolManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/students"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <StudentManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/classes"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <ClassManagement />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
