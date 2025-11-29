import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import SuperAdminProtectedRoute from "./components/SuperAdminProtectedRoute";
import FirstLoginPasswordCheck from "./components/FirstLoginPasswordCheck";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Timetable from "./pages/Timetable";
import Assignments from "./pages/Assignments";
import Exams from "./pages/Exams";
import Attendance from "./pages/Attendance";
import Fees from "./pages/Fees";
import Messages from "./pages/Messages";
import Meetings from "./pages/Meetings";
import UserManagement from "./pages/admin/UserManagement";
import TimetableManagement from "./pages/admin/TimetableManagement";
import WeeklyTimetable from "./pages/admin/WeeklyTimetable";
import SchoolManagement from "./pages/admin/SchoolManagement";
import StudentManagement from "./pages/admin/StudentManagement";
import ClassManagement from "./pages/admin/ClassManagement";
import TeacherManagement from "./pages/admin/TeacherManagement";
import ParentManagement from "./pages/admin/ParentManagement";
import CleanupUtility from "./pages/admin/CleanupUtility";
import SQLEditor from "./pages/admin/SQLEditor";
import BulkUsersPage from "./pages/admin/BulkUsersPage";
import ExamTimetableManagement from "./pages/admin/ExamTimetableManagement";
import AllowedStudentsManagement from "./pages/admin/AllowedStudentsManagement";
import WhitelistedTeachersManagement from "./pages/admin/WhitelistedTeachersManagement";
import WhitelistedParentsManagement from "./pages/admin/WhitelistedParentsManagement";
import SuperAdmin from "./pages/SuperAdmin";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import SuperAdminSignup from "./pages/SuperAdminSignup";
import NotFound from "./pages/NotFound";
import AIAssistant from "./pages/AIAssistant";
import StudentOverview from "./pages/student/StudentOverview";
import StudentProfile from "./pages/student/StudentProfile";
import StudentAcademicPage from "./pages/academic/StudentAcademic";
import StudentFinancialPage from "./pages/financial/StudentFinancial";
import TeacherOverview from "./pages/teacher/TeacherOverview";
import TeacherAcademicPage from "./pages/academic/TeacherAcademic";
import TeacherClasses from "./pages/teacher/TeacherClasses";
import TeacherStudents from "./pages/teacher/TeacherStudents";
import TeacherAIAssistant from "./pages/teacher/TeacherAIAssistant";
import ParentOverview from "./pages/parent/ParentOverview";
import ParentAcademicPage from "./pages/academic/ParentAcademic";
import AdminOverview from './pages/admin/AdminOverview';
import AdminAIModule from "./pages/admin/AdminAIModule";
import StudentsList from './pages/admin/StudentsList';
import TeachersList from './pages/admin/TeachersList';
import ParentsList from './pages/admin/ParentsList';
import UsersList from './pages/admin/UsersList';
import AdminFinancialPage from "./pages/financial/AdminFinancial";
import AdminReportsPage from "./pages/reports/AdminReports";
import ClassTeacherDashboard from "./pages/dashboards/ClassTeacherDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <FirstLoginPasswordCheck />
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
              path="/messages" 
              element={
                <ProtectedRoute roles={["admin", "teacher", "student", "parent"]}>
                  <Messages />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/meetings" 
              element={
                <ProtectedRoute roles={["admin", "teacher", "student", "parent"]}>
                  <Meetings />
                </ProtectedRoute>
              } 
            />
            <Route path="/student/overview" element={<ProtectedRoute roles={["student"]}><StudentOverview /></ProtectedRoute>} />
            <Route path="/student/profile" element={<ProtectedRoute roles={["student"]}><StudentProfile /></ProtectedRoute>} />
            <Route path="/student/academic" element={<ProtectedRoute roles={["student"]}><StudentAcademicPage /></ProtectedRoute>} />
            <Route path="/student/financial" element={<ProtectedRoute roles={["student"]}><StudentFinancialPage /></ProtectedRoute>} />
            <Route path="/student/ai-assistant" element={<ProtectedRoute roles={["student"]}><AIAssistant /></ProtectedRoute>} />
            <Route path="/teacher/overview" element={<ProtectedRoute roles={["teacher"]}><TeacherOverview /></ProtectedRoute>} />
            <Route path="/teacher/academic" element={<ProtectedRoute roles={["teacher"]}><TeacherAcademicPage /></ProtectedRoute>} />
            <Route path="/teacher/classes" element={<ProtectedRoute roles={["teacher"]}><TeacherClasses /></ProtectedRoute>} />
            <Route path="/teacher/students" element={<ProtectedRoute roles={["teacher"]}><TeacherStudents /></ProtectedRoute>} />
            <Route path="/teacher/ai-assistant" element={<ProtectedRoute roles={["teacher"]}><TeacherAIAssistant /></ProtectedRoute>} />
            <Route path="/parent/overview" element={<ProtectedRoute roles={["parent"]}><ParentOverview /></ProtectedRoute>} />
            <Route path="/parent/academic" element={<ProtectedRoute roles={["parent"]}><ParentAcademicPage /></ProtectedRoute>} />
            <Route path="/admin/overview" element={<ProtectedRoute roles={["admin"]}><AdminOverview /></ProtectedRoute>} />
            <Route path="/admin/students-list" element={<ProtectedRoute roles={["admin"]}><StudentsList /></ProtectedRoute>} />
            <Route path="/admin/teachers-list" element={<ProtectedRoute roles={["admin"]}><TeachersList /></ProtectedRoute>} />
            <Route path="/admin/parents-list" element={<ProtectedRoute roles={["admin"]}><ParentsList /></ProtectedRoute>} />
            <Route path="/admin/users-list" element={<ProtectedRoute roles={["admin"]}><UsersList /></ProtectedRoute>} />
            <Route path="/admin/financial" element={<ProtectedRoute roles={["admin"]}><AdminFinancialPage /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute roles={["admin"]}><AdminReportsPage /></ProtectedRoute>} />
            <Route path="/admin/academic" element={<ProtectedRoute roles={["admin"]}><div className="p-8 text-center">Admin Academic Page - Coming Soon</div></ProtectedRoute>} />
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
              path="/admin/weekly-timetable"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <WeeklyTimetable />
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
            <Route
              path="/admin/teachers"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <TeacherManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/parents"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <ParentManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/cleanup"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <CleanupUtility />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sql-editor"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <SQLEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/bulk-users"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <BulkUsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/exam-timetable"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <ExamTimetableManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/allowed-students"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AllowedStudentsManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/whitelisted-teachers"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <WhitelistedTeachersManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/whitelisted-parents"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <WhitelistedParentsManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/academic"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <TeacherAcademicPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/financial"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminFinancialPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/academic"
              element={
                <ProtectedRoute roles={["student"]}>
                  <StudentAcademicPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/financial"
              element={
                <ProtectedRoute roles={["student"]}>
                  <StudentFinancialPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/academic"
              element={
                <ProtectedRoute roles={["teacher"]}>
                  <TeacherAcademicPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/parent/academic"
              element={
                <ProtectedRoute roles={["parent"]}>
                  <ParentAcademicPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/class-teacher"
              element={
                <ProtectedRoute roles={["teacher"]}>
                  <ClassTeacherDashboard />
                </ProtectedRoute>
              }
            />
          <Route path="/super-admin/login" element={<SuperAdminLogin />} />
          <Route path="/super-admin/signup" element={<SuperAdminSignup />} />
          <Route
            path="/super-admin"
            element={
              <SuperAdminProtectedRoute>
                <SuperAdmin />
              </SuperAdminProtectedRoute>
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
