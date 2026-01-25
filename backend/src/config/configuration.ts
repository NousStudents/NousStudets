export default () => ({
    // Application
    app: {
        name: process.env.APP_NAME || 'School Management System',
        port: Number.parseInt(process.env.PORT ?? '3000', 10),
        environment: process.env.NODE_ENV || 'development',
        apiPrefix: process.env.API_PREFIX || 'api',
        corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
    },

    // Database
    database: {
        url: process.env.DATABASE_URL,
    },

    // JWT Authentication
    jwt: {
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    },

    // Supabase (for existing integration)
    supabase: {
        url: process.env.SUPABASE_URL,
        anonKey: process.env.SUPABASE_ANON_KEY,
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },

    // Password hashing
    bcrypt: {
        saltRounds: Number.parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10),
    },

    // Rate limiting
    rateLimit: {
        ttl: Number.parseInt(process.env.RATE_LIMIT_TTL ?? '60', 10),
        limit: Number.parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
    },
});
