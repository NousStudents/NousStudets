import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Security: Helmet for HTTP headers (XSS, clickjacking, MIME sniffing protection)
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for now, can be configured later
  }));

  // Trust proxy for rate limiting behind reverse proxies (Vercel, nginx, etc.)
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  // Global prefix
  const apiPrefix = configService.get<string>('app.apiPrefix') ?? 'api';
  app.setGlobalPrefix(apiPrefix);

  // CORS - Use env-based origins in production
  const corsOriginsEnv = configService.get<string>('CORS_ORIGINS');
  const corsOrigins = corsOriginsEnv
    ? corsOriginsEnv.split(',').map(o => o.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-School-Id'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Throw error on unknown properties
      transform: true, // Transform payloads to DTO types
      transformOptions: {
        enableImplicitConversion: true, // Automatically convert types
      },
    }),
  );

  // Get port from config
  const port = configService.get<number>('app.port') ?? 3000;

  await app.listen(port);

  console.log(`
╔══════════════════════════════════════════════════════════╗
║     School Management System - Backend API Server        ║
╠══════════════════════════════════════════════════════════╣
║  🚀 Server running on: http://localhost:${port}              ║
║  📚 API Prefix: /${apiPrefix}                                   ║
║  🔧 Environment: ${(configService.get<string>('app.environment') ?? 'development').padEnd(29)}          ║
║  🔒 Security: Helmet + Rate Limiting enabled             ║
╚══════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
