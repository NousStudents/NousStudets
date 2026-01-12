import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

// Core Modules
import { PrismaModule } from './prisma';
import configuration from './config/configuration';

// Feature Modules
import { AuthModule } from './modules/auth';
import { UsersModule } from './modules/users';
import { SchoolsModule } from './modules/schools';
// import { StudentsModule } from './modules/students';
// import { TeachersModule } from './modules/teachers';
// import { ClassesModule } from './modules/classes';
// import { AttendanceModule } from './modules/attendance';
// import { AssignmentsModule } from './modules/assignments';
// import { ExamsModule } from './modules/exams';
// import { FeesModule } from './modules/fees';

// Guards
import { JwtAuthGuard } from './common/guards';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),

    // Core
    PrismaModule,

    // Features
    AuthModule,
    UsersModule,
    SchoolsModule,
    // StudentsModule,
    // TeachersModule,
    // ClassesModule,
    // AttendanceModule,
    // AssignmentsModule,
    // ExamsModule,
    // FeesModule,
  ],
  controllers: [],
  providers: [
    // Global JWT Auth Guard (optional - can require auth by default)
    // Uncomment to require authentication on all routes by default
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAuthGuard,
    // },
  ],
})
export class AppModule { }
