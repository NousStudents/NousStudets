import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

// Core Modules
import { PrismaModule } from './prisma';
import configuration from './config/configuration';

// Feature Modules
import { AuthModule } from './modules/auth';
import { UsersModule } from './modules/users';
import { SchoolsModule } from './modules/schools';
import { StudentsModule } from './modules/students/students.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { ClassesModule } from './modules/classes/classes.module';
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

    // Rate Limiting - Global: 100 requests per 60 seconds per IP
    ThrottlerModule.forRoot([{
      ttl: 60, // 60 seconds (throttler uses seconds, not milliseconds)
      limit: 100,
    }]),

    // Core
    PrismaModule,

    // Features
    AuthModule,
    UsersModule,
    SchoolsModule,
    StudentsModule,
    TeachersModule,
    ClassesModule,
    // AttendanceModule,
    // AssignmentsModule,
    // ExamsModule,
    // FeesModule,
  ],
  controllers: [],
  providers: [
    // Global Rate Limiting Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global JWT Auth Guard (optional - can require auth by default)
    // Uncomment to require authentication on all routes by default
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAuthGuard,
    // },
  ],
})
export class AppModule { }
