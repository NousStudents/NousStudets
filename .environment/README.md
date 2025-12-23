# Environment Configuration

This folder contains environment-specific configuration files for the School Management System.

## ⚠️ Security Warning

**NEVER commit real secrets to version control!**

All `.env` files in this folder are templates with placeholder values. Real secrets should be managed through:
- **Lovable Cloud Secrets** (recommended for this project)
- Secure secret management services
- Environment variables set directly on the server

## 📁 File Structure

```
.environment/
├── local.env        # Local development (your machine)
├── development.env  # Shared development server
├── staging.env      # Pre-production testing
├── production.env   # Live production environment
├── .gitignore       # Prevents committing real secrets
└── README.md        # This file
```

## 🚀 How to Use

### For Lovable Cloud Projects

This project uses **Lovable Cloud** which automatically manages:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Additional secrets are stored in **Lovable Cloud Secrets** and accessed in Edge Functions via:
```typescript
const apiKey = Deno.env.get('YOUR_SECRET_NAME');
```

### For Traditional Deployments

1. **Copy the appropriate template:**
   ```bash
   cp .environment/local.env .env
   ```

2. **Fill in your actual values:**
   - Replace all placeholder values with real credentials
   - Never commit the resulting `.env` file

3. **Load environment variables:**
   - The application automatically loads from `.env` in the root directory
   - Or set variables directly in your hosting platform

## 📝 Variable Categories

### Frontend-Safe Variables (VITE_ prefix)
These are exposed to the browser and should NEVER contain secrets:
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_APP_NAME=School Management System
```

### Backend-Only Variables
These should ONLY be used in Edge Functions or server-side code:
```
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Full database access
OPENAI_API_KEY=sk-...             # AI services
STRIPE_SECRET_KEY=sk_live_...     # Payment processing
```

## 🔐 Managing Secrets in Lovable Cloud

1. **View existing secrets:**
   - Check the Lovable Cloud dashboard
   - Or ask Lovable AI to list current secrets

2. **Add new secrets:**
   - Use Lovable AI: "Add a secret called X"
   - Enter the value in the secure form provided

3. **Use secrets in Edge Functions:**
   ```typescript
   import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
   
   serve(async (req) => {
     const apiKey = Deno.env.get('OPENAI_API_KEY');
     // Use the secret securely
   });
   ```

## 🔄 Environment Differences

| Feature | Local | Development | Staging | Production |
|---------|-------|-------------|---------|------------|
| Debug Mode | ✅ | ✅ | ❌ | ❌ |
| Auto-confirm Email | ✅ | ✅ | ❌ | ❌ |
| Stripe Mode | Test | Test | Test | **Live** |
| Log Level | debug | info | warn | error |
| Performance Monitoring | ❌ | ✅ | ✅ | ✅ |

## 📋 Required Secrets Checklist

Before deploying, ensure these secrets are configured:

### Essential
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

### Authentication
- [ ] `JWT_SECRET` (generate with `openssl rand -base64 32`)

### AI Features (if enabled)
- [ ] `OPENAI_API_KEY` or use Lovable AI Gateway

### Payments (if enabled)
- [ ] `STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`

### Notifications (if enabled)
- [ ] `EMAIL_API_KEY`
- [ ] `SMS_PROVIDER_KEY`

## 🛡️ Best Practices

1. **Rotate secrets regularly** - Especially after team changes
2. **Use different secrets per environment** - Never share between staging/production
3. **Audit access** - Know who has access to production secrets
4. **Monitor usage** - Set up alerts for unusual API usage
5. **Backup recovery keys** - Store recovery keys securely offline

## 📚 Additional Resources

- [Lovable Cloud Documentation](https://docs.lovable.dev)
- [Supabase Environment Variables](https://supabase.com/docs/guides/functions/secrets)
- [12-Factor App Config](https://12factor.net/config)
