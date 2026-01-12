# School Management System - Backend API

A NestJS backend for the School Management System with multi-tenant architecture and role-based access control.

## 🛠 Tech Stack

- **Framework**: NestJS (TypeScript)
- **ORM**: Prisma
- **Database**: PostgreSQL (via Supabase or self-hosted)
- **Authentication**: JWT (Passport.js)
- **Validation**: class-validator, class-transformer

## 📁 Project Structure

```
backend/
├── src/
│   ├── common/           # Shared utilities
│   │   ├── decorators/   # Custom decorators (@CurrentUser, @Roles, @Public)
│   │   ├── filters/      # Exception filters
│   │   ├── guards/       # Auth guards (JWT, Roles, Tenant)
│   │   └── interceptors/ # Request/response interceptors
│   ├── config/           # Configuration
│   ├── modules/          # Feature modules
│   │   ├── auth/         # Authentication (login, register, JWT)
│   │   ├── users/        # User management
│   │   ├── schools/      # School/tenant management
│   │   ├── students/     # Student CRUD
│   │   ├── teachers/     # Teacher CRUD
│   │   ├── classes/      # Class management
│   │   ├── attendance/   # Attendance tracking
│   │   ├── assignments/  # Assignment system
│   │   ├── exams/        # Exam management
│   │   └── fees/         # Fee management
│   ├── prisma/           # Prisma service
│   ├── app.module.ts     # Root module
│   └── main.ts           # Entry point
├── prisma/
│   └── schema.prisma     # Database schema
├── .env.example          # Environment template
└── package.json
```

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy the environment template:

```bash
cp .env.example .env
```

Edit `.env` and set your database connection:

**Option A: Using Supabase**

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

Get this from: Supabase Dashboard → Settings → Database → Connection string → URI

**Option B: Local PostgreSQL**

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/school_management"
```

### 3. Generate Prisma Client

```bash
npx prisma generate
```

### 4. Run Database Migrations

```bash
# Create database tables (first time)
npx prisma db push

# Or apply migrations
npx prisma migrate dev
```

### 5. Start Development Server

```bash
npm run start:dev
```

Server will run at: `http://localhost:3000/api`

## 📚 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login with email/password |
| POST | `/auth/change-password` | Change password (auth required) |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/auth/me` | Get current user profile |
| POST | `/auth/logout` | Logout |

### Users (`/api/users`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/users` | Create user | Admin |
| GET | `/users` | List all users | Admin |
| GET | `/users/:id` | Get user by ID | All |
| PUT | `/users/:id` | Update user | Self/Admin |
| DELETE | `/users/:id` | Delete user | Admin |
| POST | `/users/assign-role` | Assign role | Admin |
| POST | `/users/remove-role` | Remove role | Admin |
| GET | `/users/role/:role` | Get users by role | Admin, Teacher |

### Schools (`/api/schools`)

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | `/schools` | Create school | Admin |
| GET | `/schools` | List all schools | Admin |
| GET | `/schools/:id` | Get school by ID | All |
| GET | `/schools/my-school` | Get current school | All |
| GET | `/schools/stats` | Get school statistics | Admin |
| GET | `/schools/subdomain/:subdomain` | Find by subdomain | Public |
| PUT | `/schools/:id` | Update school | Admin |
| DELETE | `/schools/:id` | Delete school | Admin |

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-access-token>
```

### Example: Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@school.com",
    "password": "password123",
    "schoolId": "your-school-uuid"
  }'
```

Response:

```json
{
  "user": {
    "userId": "uuid",
    "email": "admin@school.com",
    "fullName": "Admin User",
    "schoolId": "school-uuid",
    "roles": ["admin"]
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

## 👥 Roles

| Role | Description |
|------|-------------|
| `admin` | Full system access, user management |
| `teacher` | Class management, assignments, attendance |
| `student` | View-only access, submit assignments |
| `parent` | View child's data |

## 🏗 Development

### Run in development mode

```bash
npm run start:dev
```

### Build for production

```bash
npm run build
npm run start:prod
```

### Run tests

```bash
npm run test
npm run test:e2e
```

### Prisma Commands

```bash
# Generate client after schema changes
npx prisma generate

# Push schema to database (development)
npx prisma db push

# Create migration
npx prisma migrate dev --name <migration-name>

# Open Prisma Studio (database GUI)
npx prisma studio
```

## 📝 Next Steps (TODO)

- [ ] Students module
- [ ] Teachers module  
- [ ] Classes module
- [ ] Attendance module
- [ ] Assignments module
- [ ] Exams module
- [ ] Fees module
- [ ] Messaging module
- [ ] Notifications (real-time)
- [ ] File uploads (Supabase Storage)
- [ ] Rate limiting
- [ ] Swagger API docs
