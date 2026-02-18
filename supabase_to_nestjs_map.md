# Supabase to NestJS Migration Map

**Security Legend:**

* **Auth**: Requires valid JWT in `Authorization` header.
* **Roles**: Specific roles allowed (Admin, Teacher, Student, Parent).
* **Tenant**: How strict data isolation is enforced (Source: JWT `schoolId`).

## 1. Authentication & Profile

| Location | Supabase Method | Purpose | NestJS Endpoint | Auth | Roles | Tenant Source |
|----------|-----------------|---------|-----------------|------|-------|---------------|
| `AuthContext` | `auth.getSession` | Validate Session | `GET /auth/me` | Yes | All | JWT |
| `useRole` | `rpc/table_check` | Get Role Profile | `GET /users/me?include=profile` | Yes | All | JWT |
| `Auth` | `signInWithPassword` | Login | `POST /auth/login` | No | Public | Body `schoolId` |
| `Auth` | `signOut` | Logout | `POST /auth/logout` | Yes | All | N/A |
| `Auth` | `student-signup` | Public Reg | `POST /auth/register/student` | No | Public | Body `schoolId` + Email Validation |
| `Auth` | `teacher-signup` | Public Reg | `POST /auth/register/teacher` | No | Public | Body `schoolId` + Admin Approval |
| `Auth` | `parent-signup` | Public Reg | `POST /auth/register/parent` | No | Public | Body `schoolId` + Child Link |
| `Auth` | `from('schools')` | School Selector | `GET /schools` | No | Public | N/A |

## 2. Dashboard & Core Data

| Access Pattern | New Endpoint | Auth | Roles | Tenant Source |
|----------------|--------------|------|-------|---------------|
| **Admin Dashboard** | `GET /admin/dashboard/stats` | Yes | Admin | JWT |
| **Teacher Dashboard** | `GET /teachers/me/dashboard` | Yes | Teacher | JWT |
| **Student Dashboard** | `GET /students/me/dashboard` | Yes | Student | JWT |
| **Parent Dashboard** | `GET /parents/me/dashboard` | Yes | Parent | JWT |
| **User Profile** | `GET /users/me` | Yes | All | JWT |
| **Update User** | `PUT /users/me` | Yes | All | JWT |

## 3. Academic Modules

| Feature | Action | Endpoint | Roles | Tenant Source |
|---------|--------|----------|-------|---------------|
| **Classes** | List (Teacher's) | `GET /teachers/me/classes` | Teacher | JWT |
| | List (All) | `GET /classes` | Admin | JWT |
| | Details + Students | `GET /classes/:id?include=students` | Admin, Teacher | JWT |
| **Subjects** | List | `GET /subjects` | Admin, Teacher | JWT |
| | By Teacher | `GET /teachers/me/subjects` | Teacher | JWT |
| **Timetable** | View Class | `GET /timetable/class/:classId` | All | JWT |
| | View Teacher | `GET /timetable/teacher/:teacherId` | Admin, Teacher | JWT |
| | Manage | `POST /timetable`, `PUT /timetable/:id` | Admin | JWT |
| **Exams** | List Types | `GET /exams` | All | JWT |
| | Schedule | `GET /exams/:id/timetable` | All | JWT |
| | Manage | `POST /exams` | Admin | JWT |
| **Results** | View Own | `GET /students/me/results` | Student | JWT |
| | View Child | `GET /parents/me/children/:id/results` | Parent | JWT |
| | Enter Marks | `POST /exams/marks` | Admin, Teacher | JWT |
| | View Class | `GET /exams/:id/results/class/:classId` | Admin, Teacher | JWT |

## 4. Workflows & Submissions

| Feature | Action | Endpoint | Roles | Tenant Source |
|---------|--------|----------|-------|---------------|
| **Assignment** | Create | `POST /assignments` | Teacher | JWT |
| | List (Class) | `GET /classes/:id/assignments` | All | JWT |
| | View Details | `GET /assignments/:id` | All | JWT |
| **Submission** | Submit | `POST /assignments/:id/submissions` | Student | JWT |
| | View (Teacher) | `GET /assignments/:id/submissions` | Teacher | JWT |
| | Grade | `PATCH /submissions/:id` | Teacher | JWT |
| **Attendance** | Mark | `POST /attendance` | Teacher | JWT |
| | View Class | `GET /classes/:id/attendance` | Admin, Teacher | JWT |
| | View Own | `GET /students/me/attendance` | Student | JWT |

## 5. Administrative Modules

| Feature | Action | Endpoint | Roles | Tenant Source |
|---------|--------|----------|-------|---------------|
| **Fees** | List Dues (Student) | `GET /students/me/fees` | Student | JWT |
| | List All | `GET /fees` | Admin | JWT |
| | Manage Structure | `POST /fees/structure` | Admin | JWT |
| | Record Payment | `POST /fees/payments` | Admin | JWT |
| **Payroll** | View | `GET /reports/payroll` | Admin | JWT |
| | Process | `POST /payroll/process` | Admin | JWT |
| **Library** | Search Books | `GET /library/books` | All | JWT |
| | Issue/Return | `POST /library/transactions` | Librarian/Admin | JWT |
| **Inventory** | List Items | `GET /inventory` | Admin | JWT |
| | Add Item | `POST /inventory` | Admin | JWT |
| **Transport** | Routes | `GET /transport/routes` | All | JWT |
| | Manage | `POST /transport` | Admin | JWT |
| **Events** | Calendar | `GET /events` | All | JWT |
| | Create | `POST /events` | Admin | JWT |

## 6. Communication

| Feature | Action | Endpoint | Roles | Tenant Source |
|---------|--------|----------|-------|---------------|
| **Messages** | List | `GET /messages` | All | JWT |
| | Send | `POST /messages` | All | JWT |
| **Notifs** | List | `GET /notifications` | All | JWT |
| | Mark Read | `PATCH /notifications/:id/read` | All | JWT |

## 7. Edge Functions (Admin & AI)

*All mapped to `post` endpoints in `AiModule` or `AdminModule`.*

| Function | Endpoint | Roles | Status |
|----------|----------|-------|--------|
| `admin-create-user` | `POST /users` | Admin | ✅ Built |
| `admin-ai-chatbot` | `POST /ai/chatbot` | Admin | ⏳ Todo |
| `admin-ai-insights` | `GET /ai/admin/insights` | Admin | ⏳ Todo |
| `admin-fee-predictions` | `POST /ai/admin/fees/predict` | Admin | ⏳ Todo |
| `admin-smart-notifications` | `POST /notifications/smart` | Admin | ⏳ Todo |
| `admin-teacher-performance` | `GET /ai/admin/teacher-performance` | Admin | ⏳ Todo |
| `admin-timetable-generator` | `POST /ai/admin/timetable/generate` | Admin | ⏳ Todo |
| `admin-voice-assistant` | `POST /ai/voice-command` | Admin | ⏳ Todo |
| `ai-assignment-generator` | `POST /ai/teacher/assignment` | Teacher | ⏳ Todo |
| `ai-attendance-analyzer` | `GET /ai/teacher/attendance-analysis` | Teacher | ⏳ Todo |
| `ai-homework-helper` | `POST /ai/student/helper` | Student | ⏳ Todo |
| `ai-lesson-planner` | `POST /ai/teacher/lesson-plan` | Teacher | ⏳ Todo |
| `ai-performance-predictor` | `GET /ai/student/prediction` | Teacher | ⏳ Todo |
| `ai-report-writer` | `POST /ai/teacher/report` | Teacher | ⏳ Todo |
| `ai-study-assistant` | `POST /ai/student/study` | Student | ⏳ Todo |
| `system-health` | `GET /system/health` | Admin | ⏳ Todo |
